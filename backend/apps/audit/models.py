from django.db import models
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey


class AuditLog(models.Model):
    """
    Model to track user activities, authentication events, and model changes.
    """
    ACTION_CHOICES = (
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('FAILED_LOGIN', 'Failed Login'),
        ('PASSWORD_RESET', 'Password Reset'),
        ('OTHER', 'Other'),
    )

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
        help_text="The user who performed the action."
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    # Generic relation to track any model
    content_type = models.ForeignKey(
        ContentType, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="The model class that was affected (optional)."
    )
    object_id = models.CharField(
        max_length=255, 
        null=True, 
        blank=True,
        help_text="The primary key of the affected model instance (optional)."
    ) 
    content_object = GenericForeignKey('content_type', 'object_id')
    
    object_repr = models.CharField(
        max_length=255, 
        null=True, 
        blank=True,
        help_text="A string representation of the affected object."
    )
    changes = models.JSONField(
        default=dict, 
        blank=True,
        help_text="A dictionary representing the changes made (e.g., {'field': ['old', 'new']})."
    )
    
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
        indexes = [
            models.Index(fields=['action']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        actor_name = self.actor if self.actor else "System/Unknown"
        return f"[{self.timestamp}] {actor_name} -> {self.action} on {self.object_repr or 'System'}"
