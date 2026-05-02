"""
Management command to seed initial data:
  - Superuser admin (username=admin, email=admin@admin.com, password=admin123)
  - Default VIP plans (level 0–3)
"""
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()

VIP_PLANS = [
    {
        "level": 0,
        "name": "Regular",
        "min_deposit": Decimal("0.00"),
        "daily_task_limit": 3,
        "description": "Default level for all users.",
    },
    {
        "level": 1,
        "name": "VIP 1",
        "min_deposit": Decimal("100.00"),
        "daily_task_limit": 5,
        "description": "Entry-level VIP membership.",
    },
    {
        "level": 2,
        "name": "VIP 2",
        "min_deposit": Decimal("500.00"),
        "daily_task_limit": 10,
        "description": "Intermediate VIP membership.",
    },
    {
        "level": 3,
        "name": "VIP 3",
        "min_deposit": Decimal("2000.00"),
        "daily_task_limit": 20,
        "description": "Premium VIP membership.",
    },
]


class Command(BaseCommand):
    help = "Seed initial admin user and default VIP plans."

    def handle(self, *args, **options):
        self._seed_admin()
        self._seed_vip_plans()

    def _seed_admin(self):
        email = "admin@admin.com"
        username = "admin"
        password = "admin123"

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f"Admin user '{email}' already exists — skipped."))
            return

        User.objects.create_superuser(
            email=email,
            username=username,
            password=password,
            first_name="Admin",
            last_name="User",
        )
        self.stdout.write(self.style.SUCCESS(f"Created superuser: {email} / {password}"))

    def _seed_vip_plans(self):
        from apps.wallet.models import VIPPlan

        for plan_data in VIP_PLANS:
            obj, created = VIPPlan.objects.get_or_create(
                level=plan_data["level"],
                defaults=plan_data,
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created VIP plan: {obj.name} (level {obj.level})"))
            else:
                self.stdout.write(self.style.WARNING(f"VIP plan level {obj.level} already exists — skipped."))
