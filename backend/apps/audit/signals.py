"""
Audit signals — automatically log CREATE / UPDATE / DELETE events
for the models listed in AUDITABLE_MODELS.

Each model gets its own receiver so signal dispatch is O(1) per model
instead of firing a global handler on every save/delete in the project.
"""

import json
import uuid
from decimal import Decimal
from datetime import date, datetime

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from django.forms.models import model_to_dict

from .models import AuditLog
from .middleware import get_audit_user, get_audit_ip

# Imported lazily inside the receivers to avoid circular-import issues at
# app startup; we reference the classes only after all apps are ready.
from apps.accounts.models import CustomUser
from apps.rbac.models import Role, Permission

AUDITABLE_MODELS = (CustomUser, Role, Permission)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_actor():
    """Return the authenticated request user, or None for anonymous/system."""
    user = get_audit_user()
    if getattr(user, 'is_authenticated', False):
        return user
    return None


class AuditJSONEncoder(json.JSONEncoder):
    """Handle UUID, Decimal, and date/datetime values in change payloads."""

    def default(self, obj):
        if isinstance(obj, uuid.UUID):
            return str(obj)
        if isinstance(obj, Decimal):
            return str(obj)
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        return super().default(obj)


def _normalize(d):
    """
    Mask sensitive fields and coerce values to JSON-safe types.
    Returns a new dict safe for storage in a JSONField.
    """
    MASKED = {'password', 'avatar', 'token'}
    result = {}
    for k, v in d.items():
        if k in MASKED:
            result[k] = '*** MASKED ***'
            continue
        try:
            json.dumps({k: v}, cls=AuditJSONEncoder)
            result[k] = v
        except Exception:
            result[k] = str(v)
    return result


def _log(action, instance, changes=None):
    """Create a single AuditLog row."""
    safe_changes = json.loads(
        json.dumps(changes or {}, cls=AuditJSONEncoder)
    )
    AuditLog.objects.create(
        actor=get_actor(),
        action=action,
        ip_address=get_audit_ip(),
        content_type=ContentType.objects.get_for_model(instance),
        object_id=str(instance.pk),
        object_repr=str(instance)[:255],
        changes=safe_changes,
    )


# ---------------------------------------------------------------------------
# Per-model receivers (scoped with sender= for efficient dispatch)
# ---------------------------------------------------------------------------

def _on_save(sender, instance, created, **kwargs):
    action = 'CREATE' if created else 'UPDATE'
    try:
        changes = _normalize(model_to_dict(instance))
    except Exception as exc:
        changes = {'error': f'Could not serialize model: {exc}'}
    _log(action, instance, changes)


def _on_delete(sender, instance, **kwargs):
    _log('DELETE', instance)


for _model in AUDITABLE_MODELS:
    receiver(post_save, sender=_model)(_on_save)
    receiver(post_delete, sender=_model)(_on_delete)