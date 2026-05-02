"""
RBAC serializers for roles, permissions, and user-role assignments.
"""
from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Role, Permission, RolePermission, UserRole

User = get_user_model()


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ("id", "codename", "name", "category", "description")
        read_only_fields = ("id",)


class RoleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing roles."""

    permissions_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ("id", "name", "description", "is_default", "permissions_count", "created_at")
        read_only_fields = ("id", "created_at")

    def get_permissions_count(self, obj):
        return obj.role_permissions.count()


class RoleDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with full permission list."""

    permissions = PermissionSerializer(many=True, read_only=True)

    class Meta:
        model = Role
        fields = ("id", "name", "description", "is_default", "permissions", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class RolePermissionUpdateSerializer(serializers.Serializer):
    """Add or remove permissions from a role."""

    permission_ids = serializers.ListField(
        child=serializers.UUIDField(), required=True
    )


class UserRoleSerializer(serializers.ModelSerializer):
    """Serializer for user-role assignments."""

    user_email = serializers.EmailField(source="user.email", read_only=True)
    role_name = serializers.CharField(source="role.name", read_only=True)
    assigned_by_email = serializers.EmailField(
        source="assigned_by.email", read_only=True, default=None
    )

    class Meta:
        model = UserRole
        fields = ("id", "user", "role", "user_email", "role_name", "assigned_at", "assigned_by", "assigned_by_email")
        read_only_fields = ("id", "assigned_at", "assigned_by", "user_email", "role_name", "assigned_by_email")


class AssignRoleSerializer(serializers.Serializer):
    """Assign a role to a user."""

    user_id = serializers.UUIDField(required=True)
    role_id = serializers.UUIDField(required=True)


class UserWithRolesSerializer(serializers.ModelSerializer):
    """User serializer that includes assigned roles."""

    roles = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "is_active", "date_joined", "roles")
        read_only_fields = fields

    def get_roles(self, obj):
        return list(obj.user_roles.values_list("role__name", flat=True))


class AdminUserSerializer(serializers.ModelSerializer):
    """Admin-only serializer for robust user CRUD spanning attributes like is_email_verified."""

    roles = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = (
            "id", "email", "username", "first_name", "last_name", "phone", "bio",
            "is_active", "is_staff", "is_superuser", "is_email_verified",
            "date_joined", "roles", "password",
            "status", "vip_level", "wallet_balance", "referral_code",
        )
        read_only_fields = ("id", "date_joined", "roles", "wallet_balance", "referral_code")

    def get_roles(self, obj):
        return list(obj.user_roles.values_list("role__name", flat=True))

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
