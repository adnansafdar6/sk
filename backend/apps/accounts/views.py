"""
Auth views — register, login, logout, profile, change password.
"""
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from apps.wallet.exceptions import AuthRateThrottle

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    ChangePasswordSerializer,
    VerifyEmailSerializer,
    ResendVerificationSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)
from .tokens import verify_email_token, verify_password_reset_token
from .emails import send_verification_email, send_password_reset_email
from apps.audit.utils import log_auth_event

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — Create a new user account."""

    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    throttle_classes = [AuthRateThrottle]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Grant welcome bonus if configured
        welcome_bonus = getattr(settings, "WELCOME_BONUS_AMOUNT", 0)
        if welcome_bonus:
            from apps.wallet.models import Transaction
            user.wallet_balance += welcome_bonus
            user.save(update_fields=["wallet_balance"])
            Transaction.objects.create(
                user=user,
                type=Transaction.TYPE_BONUS,
                amount=welcome_bonus,
                description="Welcome bonus",
            )

        try:
            send_verification_email(user)
        except Exception:
            pass  # Don't block registration if email delivery fails

        return Response(
            {
                "user": UserSerializer(user).data,
                "detail": "Registration successful. Please check your email to verify your account."
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """POST /api/auth/login/ — Authenticate and return JWT tokens."""

    permission_classes = (AllowAny,)
    throttle_classes = [AuthRateThrottle]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        identifier = serializer.validated_data["identifier"]
        password = serializer.validated_data["password"]

        # Resolve identifier to a user object (email / username / phone)
        user_obj = None
        if "@" in identifier:
            user_obj = User.objects.filter(email__iexact=identifier).first()
        if user_obj is None:
            user_obj = User.objects.filter(username__iexact=identifier).first()
        if user_obj is None:
            user_obj = User.objects.filter(phone=identifier).first()

        # Use Django's authenticate to verify credentials (respects backends)
        user = None
        if user_obj is not None:
            user = authenticate(request, email=user_obj.email, password=password)

        if user is None:
            log_auth_event('FAILED_LOGIN', email_attempted=identifier)
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {"detail": "Account is disabled."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Require email verification to login (skipped in DEBUG mode for easier dev)
        if not settings.DEBUG and getattr(user, 'is_email_verified', False) is False:
            return Response(
                {
                    "detail": "Please verify your email address to login.",
                    "code": "email_unverified"
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)

        # Gather user roles and permissions
        roles = list(user.user_roles.values_list("role__name", flat=True))
        # Also include the direct role field — this is the primary role assignment
        # method on this platform. UserRole records may not exist for all users.
        if user.role and user.role not in roles:
            roles = [user.role] + roles
        # Django superusers always get "admin" so the frontend works correctly
        # even when no UserRole record exists and the role field is unset.
        if user.is_superuser and "admin" not in roles:
            roles = ["admin"] + roles
        permissions = list(
            user.user_roles.values_list(
                "role__role_permissions__permission__codename", flat=True
            ).distinct()
        )

        log_auth_event('LOGIN', user=user)

        return Response(
            {
                "user": UserSerializer(user).data,
                "roles": roles,
                "permissions": permissions,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """POST /api/auth/logout/ — Blacklist the refresh token."""

    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"detail": "Refresh token is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            log_auth_event('LOGOUT', user=request.user)
            return Response(
                {"detail": "Successfully logged out."},
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {"detail": "Invalid or expired token."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UserProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/profile/ — Retrieve or update own profile."""

    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/ — Change the authenticated user's password."""

    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        log_auth_event('PASSWORD_RESET', user=request.user)
        return Response(
            {"detail": "Password changed successfully."},
            status=status.HTTP_200_OK,
        )


class VerifyEmailView(APIView):
    """POST /api/auth/verify-email/ — Verify user email using token."""
    
    permission_classes = (AllowAny,)
    
    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data["token"]
        user_id = verify_email_token(token)
        
        if not user_id:
            return Response(
                {"detail": "Invalid or expired verification link."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            user = User.objects.get(id=user_id)
            if user.is_email_verified:
                return Response(
                    {"detail": "Email is already verified."},
                    status=status.HTTP_200_OK
                )
            
            user.is_email_verified = True
            user.save(update_fields=["is_email_verified"])
            return Response(
                {"detail": "Email successfully verified!"},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )


class ResendVerificationEmailView(APIView):
    """POST /api/auth/resend-verification/ — Resend email verification link."""
    
    permission_classes = (AllowAny,)
    
    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            user = User.objects.get(email=serializer.validated_data["email"])
            if user.is_email_verified:
                return Response(
                    {"detail": "Email is already verified."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            try:
                send_verification_email(user)
            except Exception:
                pass  # Don't surface mail failures to the caller
            return Response(
                {"detail": "Verification email sent."},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            # Mask user existence for security
            return Response(
                {"detail": "If an account exists with this email, a verification link has been sent."},
                status=status.HTTP_200_OK
            )


class ForgotPasswordView(APIView):
    """POST /api/auth/forgot-password/ — Request password reset email."""
    
    permission_classes = (AllowAny,)
    
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            user = User.objects.get(email=serializer.validated_data["email"])
            try:
                send_password_reset_email(user)
            except Exception:
                pass  # Don't surface mail failures to the caller
        except User.DoesNotExist:
            pass  # Mask user existence
            
        return Response(
            {"detail": "If an account exists with this email, a password reset link has been sent."},
            status=status.HTTP_200_OK
        )


class ResetPasswordView(APIView):
    """POST /api/auth/reset-password/ — Reset password using token."""
    
    permission_classes = (AllowAny,)
    
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data["token"]
        user_id = verify_password_reset_token(token)
        
        if not user_id:
            return Response(
                {"detail": "Invalid or expired reset link."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            user = User.objects.get(id=user_id)
            user.set_password(serializer.validated_data["new_password"])
            user.save(update_fields=["password"])
            log_auth_event('PASSWORD_RESET', user=user)
            return Response(
                {"detail": "Password has been reset successfully. You can now login."},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )
