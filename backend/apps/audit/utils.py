from .models import AuditLog
from .middleware import get_audit_ip

def log_auth_event(action, user=None, email_attempted=None):
    """
    Manually log an authentication-related event.
    """
    ip_address = get_audit_ip()
    
    object_repr = ""
    if user:
        object_repr = getattr(user, 'email', str(user))
    elif email_attempted:
        object_repr = f"Attempted email: {email_attempted}"
        
    AuditLog.objects.create(
        actor=user,
        action=action,
        ip_address=ip_address,
        object_repr=object_repr,
        changes={}
    )
