"""
DRF permission classes for RBAC enforcement.
"""
from rest_framework.permissions import BasePermission


class HasRole(BasePermission):
    """
    Check that the authenticated user has at least one of the required roles.

    Usage in a view:
        permission_classes = [IsAuthenticated, HasRole]
        required_roles = ['admin', 'manager']
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        required_roles = getattr(view, "required_roles", [])
        if not required_roles:
            return True

        user_roles = set(getattr(request, "user_roles", []))
        return bool(user_roles & set(required_roles))


class HasPermission(BasePermission):
    """
    Check that the authenticated user has all of the required permissions.

    Usage in a view:
        permission_classes = [IsAuthenticated, HasPermission]
        required_permissions = ['users.view', 'users.edit']
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        required_permissions = getattr(view, "required_permissions", [])
        if not required_permissions:
            return True

        user_permissions = set(getattr(request, "user_permissions", []))
        return set(required_permissions).issubset(user_permissions)


class IsAdmin(BasePermission):
    """Shortcut: user must have the 'admin' role."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # Check direct role field (primary method used by this platform)
        if getattr(request.user, "role", None) in ("admin", "manager"):
            return True
        # Fall back to RBAC UserRole table and superuser flag
        user_roles = set(getattr(request, "user_roles", []))
        return "admin" in user_roles or request.user.is_superuser
