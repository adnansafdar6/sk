"""
RBAC Middleware — attaches user_roles and user_permissions to every request.
"""
from django.utils.functional import SimpleLazyObject

from .models import UserRole


def _get_user_roles(user):
    """Return a list of role names for the given user."""
    if not user or not user.is_authenticated:
        return []
    return list(
        UserRole.objects.filter(user=user).values_list("role__name", flat=True)
    )


def _get_user_permissions(user):
    """Return a list of permission codenames for the given user."""
    if not user or not user.is_authenticated:
        return []
    return list(
        UserRole.objects.filter(user=user)
        .values_list("role__role_permissions__permission__codename", flat=True)
        .distinct()
    )


class RBACMiddleware:
    """
    Attach `request.user_roles` and `request.user_permissions` lazily.
    This avoids DB queries unless the attributes are actually accessed.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.user_roles = SimpleLazyObject(
            lambda: _get_user_roles(request.user)
        )
        request.user_permissions = SimpleLazyObject(
            lambda: _get_user_permissions(request.user)
        )
        return self.get_response(request)
