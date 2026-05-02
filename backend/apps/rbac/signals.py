"""
Signal: auto-assign default role(s) to newly registered users.
"""
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def assign_default_role(sender, instance, created, **kwargs):
    """Assign role(s) marked as `is_default=True` to new users."""
    if created:
        from .models import Role, UserRole

        default_roles = Role.objects.filter(is_default=True)
        for role in default_roles:
            UserRole.objects.get_or_create(user=instance, role=role)
