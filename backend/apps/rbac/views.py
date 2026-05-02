"""
RBAC views — role/permission management, user-role assignment.
"""
from django.contrib.auth import get_user_model
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Role, Permission, RolePermission, UserRole
from .permissions import IsAdmin
from .serializers import (
    RoleListSerializer,
    RoleDetailSerializer,
    RolePermissionUpdateSerializer,
    PermissionSerializer,
    UserRoleSerializer,
    AssignRoleSerializer,
    UserWithRolesSerializer,
    AdminUserSerializer,
)

User = get_user_model()


# ─── Role Management ────────────────────────────────────────────────


class RoleViewSet(viewsets.ModelViewSet):
    """CRUD for roles (admin only)."""

    queryset = Role.objects.all()
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_serializer_class(self):
        if self.action in ("retrieve",):
            return RoleDetailSerializer
        return RoleListSerializer

    @action(detail=True, methods=["post"], url_path="add-permissions")
    def add_permissions(self, request, pk=None):
        """POST /api/rbac/roles/{id}/add-permissions/"""
        role = self.get_object()
        serializer = RolePermissionUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        permission_ids = serializer.validated_data["permission_ids"]
        permissions = Permission.objects.filter(id__in=permission_ids)
        created = 0
        for perm in permissions:
            _, was_created = RolePermission.objects.get_or_create(role=role, permission=perm)
            if was_created:
                created += 1
        return Response(
            {"detail": f"{created} permission(s) added to role '{role.name}'."},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="remove-permissions")
    def remove_permissions(self, request, pk=None):
        """POST /api/rbac/roles/{id}/remove-permissions/"""
        role = self.get_object()
        serializer = RolePermissionUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        permission_ids = serializer.validated_data["permission_ids"]
        deleted, _ = RolePermission.objects.filter(
            role=role, permission_id__in=permission_ids
        ).delete()
        return Response(
            {"detail": f"{deleted} permission(s) removed from role '{role.name}'."},
            status=status.HTTP_200_OK,
        )


# ─── Permission Management ──────────────────────────────────────────


class PermissionViewSet(viewsets.ModelViewSet):
    """CRUD for permissions (admin only)."""

    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated, IsAdmin]


# ─── User-Role Assignment ───────────────────────────────────────────


class AssignRoleView(APIView):
    """POST /api/rbac/assign-role/ — Assign a role to a user (admin only)."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        serializer = AssignRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = User.objects.get(id=serializer.validated_data["user_id"])
            role = Role.objects.get(id=serializer.validated_data["role_id"])
        except (User.DoesNotExist, Role.DoesNotExist) as e:
            return Response(
                {"detail": str(e)}, status=status.HTTP_404_NOT_FOUND
            )

        _, created = UserRole.objects.get_or_create(
            user=user, role=role, defaults={"assigned_by": request.user}
        )

        if not created:
            return Response(
                {"detail": f"User already has role '{role.name}'."},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(
            {"detail": f"Role '{role.name}' assigned to {user.email}."},
            status=status.HTTP_201_CREATED,
        )


class RevokeRoleView(APIView):
    """POST /api/rbac/revoke-role/ — Revoke a role from a user (admin only)."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        serializer = AssignRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        deleted, _ = UserRole.objects.filter(
            user_id=serializer.validated_data["user_id"],
            role_id=serializer.validated_data["role_id"],
        ).delete()

        if deleted == 0:
            return Response(
                {"detail": "User does not have this role."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {"detail": "Role revoked successfully."},
            status=status.HTTP_200_OK,
        )


# ─── Current User's Permissions ─────────────────────────────────────


class MyPermissionsView(APIView):
    """GET /api/rbac/my-permissions/ — Return current user's roles & permissions."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        roles = list(request.user_roles) if hasattr(request, "user_roles") else []
        permissions = list(request.user_permissions) if hasattr(request, "user_permissions") else []

        # Include the user's direct role field (used by this platform as the
        # primary role assignment, without needing a UserRole record).
        direct_role = getattr(request.user, "role", None)
        if direct_role and direct_role not in roles:
            roles = [direct_role] + roles

        # Django superusers always get the "admin" role on the frontend so
        # the sidebar, permission guards, and API checks all work correctly
        # even when no UserRole record exists and role field is unset.
        if request.user.is_superuser and "admin" not in roles:
            roles = ["admin"] + roles

        return Response(
            {"roles": roles, "permissions": permissions},
            status=status.HTTP_200_OK,
        )


# ─── Users List (with roles) ────────────────────────────────────────


class AdminUserViewSet(viewsets.ModelViewSet):
    """CRUD for users (admin only) including status, VIP, and wallet management."""

    queryset = User.objects.prefetch_related("user_roles__role").all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    @action(detail=True, methods=["post"], url_path="set-status")
    def set_status(self, request, pk=None):
        """POST /api/rbac/users/{id}/set-status/ — Set user status: active/banned/suspended."""
        user = self.get_object()
        new_status = request.data.get("status")
        valid = [s[0] for s in user.__class__.STATUS_CHOICES]
        if new_status not in valid:
            return Response(
                {"detail": f"Invalid status. Choose from: {valid}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.status = new_status
        user.save(update_fields=["status", "is_active"])
        return Response({"detail": f"User status set to '{new_status}'.", "status": new_status})

    @action(detail=True, methods=["post"], url_path="set-vip")
    def set_vip(self, request, pk=None):
        """POST /api/rbac/users/{id}/set-vip/ — Change VIP level."""
        user = self.get_object()
        try:
            level = int(request.data.get("vip_level", -1))
        except (TypeError, ValueError):
            level = -1
        valid = [v[0] for v in user.__class__.VIP_CHOICES]
        if level not in valid:
            return Response(
                {"detail": f"Invalid VIP level. Choose from: {valid}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.vip_level = level
        user.save(update_fields=["vip_level"])
        return Response({"detail": f"VIP level set to {level}.", "vip_level": level})

    @action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request, pk=None):
        """POST /api/rbac/users/{id}/reset-password/ — Set a new password for the user."""
        user = self.get_object()
        new_password = request.data.get("new_password", "").strip()
        if len(new_password) < 8:
            return Response(
                {"detail": "Password must be at least 8 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(new_password)
        user.save(update_fields=["password"])
        return Response({"detail": "Password reset successfully."})

    @action(detail=True, methods=["post"], url_path="adjust-balance")
    def adjust_balance(self, request, pk=None):
        """POST /api/rbac/users/{id}/adjust-balance/ — Manually credit or debit wallet."""
        from decimal import Decimal, InvalidOperation
        from apps.wallet.models import Transaction

        user = self.get_object()

        try:
            amount = Decimal(str(request.data.get("amount", "")))
        except (InvalidOperation, TypeError):
            return Response({"detail": "Invalid amount."}, status=status.HTTP_400_BAD_REQUEST)

        if amount == 0:
            return Response({"detail": "Amount cannot be zero."}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get("reason", "Manual admin adjustment").strip() or "Manual admin adjustment"

        user.wallet_balance += amount
        user.save(update_fields=["wallet_balance"])

        tx_type = Transaction.TYPE_BONUS if amount > 0 else Transaction.TYPE_WITHDRAWAL
        Transaction.objects.create(
            user=user,
            type=tx_type,
            amount=abs(amount),
            description=f"Admin adjustment: {reason}",
        )

        return Response({
            "detail": f"Balance {'credited' if amount > 0 else 'debited'} by {abs(amount)}.",
            "wallet_balance": str(user.wallet_balance),
        })
