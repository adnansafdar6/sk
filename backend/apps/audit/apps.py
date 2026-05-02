from django.apps import AppConfig


class AuditConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.audit"
    verbose_name = "Audit Logging"

    def ready(self):
        # Implicitly connect signals when app is ready
        import apps.audit.signals  # noqa
