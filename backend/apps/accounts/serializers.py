"""
Serializers for authentication and user management.
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""

    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True, required=True)
    referral_code = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = User
        fields = (
            "email",
            "username",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "phone",
            "referral_code",
        )
        extra_kwargs = {
            "first_name": {"required": True},
            "last_name": {"required": True},
            "username": {"required": True},
        }

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        referral = attrs.pop("referral_code", "").strip()
        if referral:
            if not User.objects.filter(referral_code=referral).exists():
                raise serializers.ValidationError(
                    {"referral_code": "Invalid referral code."}
                )
            attrs["_referral_code"] = referral
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        validated_data.pop("_referral_code", None)
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    """Serializer for login — accepts email, username, or phone + password."""

    identifier = serializers.CharField(required=True, help_text="Email, username, or phone number.")
    password = serializers.CharField(required=True, write_only=True)


class UserSerializer(serializers.ModelSerializer):
    """Serializer for reading/updating user profile."""

    roles = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "phone",
            "bio",
            "avatar",
            "date_of_birth",
            "is_active",
            "date_joined",
            "roles",
            "role",
            "status",
            "vip_level",
            "wallet_balance",
            "referral_code",
        )
        read_only_fields = (
            "id", "email", "is_active", "date_joined", "roles",
            "role", "status", "vip_level", "wallet_balance", "referral_code",
        )
        extra_kwargs = {
            "username": {"required": False},
            "phone": {"required": False},
        }

    def validate_username(self, value):
        user = self.instance
        if user and User.objects.filter(username=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def get_roles(self, obj):
        return list(obj.user_roles.values_list("role__name", flat=True))


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change."""

    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "New passwords do not match."}
            )
        return attrs

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value


class VerifyEmailSerializer(serializers.Serializer):
    """Serializer to verify email token."""
    token = serializers.CharField(required=True)


class ResendVerificationSerializer(serializers.Serializer):
    """Serializer to request a new verification email."""
    email = serializers.EmailField(required=True)


class ForgotPasswordSerializer(serializers.Serializer):
    """Serializer to request a password reset email."""
    email = serializers.EmailField(required=True)


class ResetPasswordSerializer(serializers.Serializer):
    """Serializer to reset password using token."""
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "New passwords do not match."}
            )
        return attrs
