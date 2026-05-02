"""
RBAC models — Role, Permission, and M2M through tables.
"""
import uuid
from django.conf import settings
from django.db import models


class Permission(models.Model):
    """A granular permission, e.g. 'users.view', 'roles.manage'."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    codename = models.CharField(max_length=100, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, db_index=True, help_text="Permission category, e.g. 'users', 'roles', 'content'")
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["category", "codename"]
        verbose_name = "permission"
        verbose_name_plural = "permissions"

    def __str__(self):
        return f"{self.codename} — {self.name}"


class Role(models.Model):
    """A named role that groups permissions together."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.TextField(blank=True)
    is_default = models.BooleanField(
        default=False,
        help_text="If True, this role is auto-assigned to new users on registration.",
    )
    permissions = models.ManyToManyField(
        Permission,
        through="RolePermission",
        related_name="roles",
        blank=True,
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "role"
        verbose_name_plural = "roles"

    def __str__(self):
        return self.name


class RolePermission(models.Model):
    """Through table: Role ↔ Permission with timestamp."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.ForeignKey(
        Role, on_delete=models.CASCADE, related_name="role_permissions"
    )
    permission = models.ForeignKey(
        Permission, on_delete=models.CASCADE, related_name="role_permissions"
    )
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("role", "permission")
        verbose_name = "role permission"
        verbose_name_plural = "role permissions"

    def __str__(self):
        return f"{self.role.name} → {self.permission.codename}"


class UserRole(models.Model):
    """Through table: User ↔ Role with timestamp and assigned_by."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_roles",
    )
    role = models.ForeignKey(
        Role, on_delete=models.CASCADE, related_name="user_roles"
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="roles_assigned",
    )

    class Meta:
        unique_together = ("user", "role")
        verbose_name = "user role"
        verbose_name_plural = "user roles"

    def __str__(self):
        return f"{self.user.email} — {self.role.name}"
