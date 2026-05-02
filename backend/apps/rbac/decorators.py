"""
Decorators for function-based views — RBAC enforcement.
"""
from functools import wraps
from rest_framework.response import Response
from rest_framework import status


def role_required(*roles):
    """
    Decorator: require user to have at least one of the specified roles.

    Usage:
        @api_view(['GET'])
        @role_required('admin', 'manager')
        def my_view(request): ...
    """

    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user or not request.user.is_authenticated:
                return Response(
                    {"detail": "Authentication required."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            user_roles = set(getattr(request, "user_roles", []))
            if not (user_roles & set(roles)):
                return Response(
                    {"detail": "You do not have the required role."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator


def permission_required(*permissions):
    """
    Decorator: require user to have ALL specified permissions.

    Usage:
        @api_view(['POST'])
        @permission_required('users.create', 'users.edit')
        def my_view(request): ...
    """

    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user or not request.user.is_authenticated:
                return Response(
                    {"detail": "Authentication required."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            user_permissions = set(getattr(request, "user_permissions", []))
            if not set(permissions).issubset(user_permissions):
                return Response(
                    {"detail": "You do not have the required permissions."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator
