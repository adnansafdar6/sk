import threading

from django.utils.functional import SimpleLazyObject


class AuditLocal(threading.local):
    user = None
    ip = None


_audit_local = AuditLocal()


def get_audit_user():
    """Retrieve the current user from thread-local storage."""
    return getattr(_audit_local, 'user', None)


def get_audit_ip():
    """Retrieve the current IP address from thread-local storage."""
    return getattr(_audit_local, 'ip', None)


class AuditLogMiddleware:
    """
    Middleware to capture the request user and IP address, making them
    available globally for the signals system to record in audit logs.

    The user is stored as a SimpleLazyObject so that it is resolved only
    when first accessed. This ensures that DRF's JWT authentication —
    which runs inside dispatch(), after all middleware — has already
    populated request.user by the time any signal handler reads it.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Lazily bind request.user so JWT-authenticated users are captured
        # correctly even though DRF authenticates after the middleware stack.
        _audit_local.user = SimpleLazyObject(lambda: getattr(request, 'user', None))

        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            _audit_local.ip = x_forwarded_for.split(',')[0].strip()
        else:
            _audit_local.ip = request.META.get('REMOTE_ADDR')

        response = self.get_response(request)

        # Clean up to prevent data leaking into subsequent requests on the same thread.
        _audit_local.user = None
        _audit_local.ip = None

        return response
