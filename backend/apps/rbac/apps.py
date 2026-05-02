from django.apps import AppConfig


class RBACConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.rbac"
    verbose_name = "RBAC"

    def ready(self):
        import apps.rbac.signals  # noqa: F401
