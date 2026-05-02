"""
Management command: seed_plans
Creates demo investment plans. Safe to re-run — skips existing slugs.

Usage:
    python manage.py seed_plans
    python manage.py seed_plans --clear   # delete all plans first
"""
from decimal import Decimal
from django.core.management.base import BaseCommand
from apps.plans.models import Plan


PLANS = [
    {
        "name":           "Starter",
        "description":    "Perfect entry point. Earn steady daily USDT with zero hassle.",
        "price":          Decimal("50.00"),
        "duration_days":  30,
        "daily_earnings": Decimal("2.00"),
        "total_return":   Decimal("60.00"),
        "is_active":      True,
        "is_featured":    False,
        "sort_order":     1,
        "features": [
            "30-day active plan",
            "$2.00 daily USDT reward",
            "TRC20 withdrawal support",
            "24/7 customer support",
            "Dashboard earnings tracker",
        ],
    },
    {
        "name":           "Silver",
        "description":    "Our most popular plan. High returns with a balanced investment.",
        "price":          Decimal("200.00"),
        "duration_days":  30,
        "daily_earnings": Decimal("9.00"),
        "total_return":   Decimal("270.00"),
        "is_active":      True,
        "is_featured":    True,
        "sort_order":     2,
        "features": [
            "30-day active plan",
            "$9.00 daily USDT reward",
            "Priority withdrawal processing",
            "Dedicated support agent",
            "All Starter features included",
            "Instant balance updates",
        ],
    },
    {
        "name":           "Gold",
        "description":    "For serious earners. Maximum daily rewards with premium perks.",
        "price":          Decimal("500.00"),
        "duration_days":  30,
        "daily_earnings": Decimal("25.00"),
        "total_return":   Decimal("750.00"),
        "is_active":      True,
        "is_featured":    False,
        "sort_order":     3,
        "features": [
            "30-day active plan",
            "$25.00 daily USDT reward",
            "VIP task pool access",
            "Same-day withdrawals",
            "All Silver features included",
            "Exclusive Gold-tier tasks",
            "Personal account manager",
        ],
    },
    {
        "name":           "Diamond",
        "description":    "Elite tier for maximum crypto income. Unmatched daily earnings.",
        "price":          Decimal("1000.00"),
        "duration_days":  30,
        "daily_earnings": Decimal("55.00"),
        "total_return":   Decimal("1650.00"),
        "is_active":      True,
        "is_featured":    False,
        "sort_order":     4,
        "features": [
            "30-day active plan",
            "$55.00 daily USDT reward",
            "Instant withdrawals — no wait",
            "Highest-paying exclusive tasks",
            "All Gold features included",
            "Diamond VIP badge",
            "Priority 24/7 concierge support",
            "150% total return on investment",
        ],
    },
]


class Command(BaseCommand):
    help = "Seed the database with demo investment plans."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing plans before seeding.",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            deleted, _ = Plan.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing plan(s)."))

        created = skipped = 0
        for data in PLANS:
            slug = data["name"].lower().replace(" ", "-")
            if Plan.objects.filter(slug=slug).exists():
                skipped += 1
                self.stdout.write(f"  skip  '{data['name']}' (already exists)")
                continue

            Plan.objects.create(**data)
            created += 1
            self.stdout.write(self.style.SUCCESS(f"  created '{data['name']}'"))

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone — {created} plan(s) created, {skipped} skipped."
            )
        )
