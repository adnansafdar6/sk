"""
Wallet models — VIP plans, transactions, and withdrawal requests.
"""
import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class VIPPlan(models.Model):
    """Defines a VIP tier and its requirements / benefits."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    level = models.IntegerField(unique=True, db_index=True, help_text="VIP level integer (0 = Regular).")
    name = models.CharField(max_length=100)
    min_deposit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Minimum cumulative deposit to reach this level.",
    )
    daily_task_limit = models.PositiveIntegerField(
        default=5,
        help_text="Maximum tasks a user at this level can complete per day (across all tasks).",
    )
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["level"]
        verbose_name = "VIP plan"
        verbose_name_plural = "VIP plans"

    def __str__(self):
        return f"VIP {self.level} — {self.name}"


class Transaction(models.Model):
    """Ledger entry for every credit / debit to a user's wallet."""

    TYPE_DEPOSIT = "deposit"
    TYPE_WITHDRAWAL = "withdrawal"
    TYPE_EARNING = "earning"
    TYPE_BONUS = "bonus"
    TYPE_REFUND = "refund"
    TYPE_CHOICES = [
        (TYPE_DEPOSIT, "Deposit"),
        (TYPE_WITHDRAWAL, "Withdrawal"),
        (TYPE_EARNING, "Earning"),
        (TYPE_BONUS, "Bonus"),
        (TYPE_REFUND, "Refund"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    type = models.CharField(max_length=15, choices=TYPE_CHOICES, db_index=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "transaction"
        verbose_name_plural = "transactions"
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["user", "type"]),
        ]

    def __str__(self):
        return f"{self.user} | {self.type} | {self.amount}"


class Withdrawal(models.Model):
    """A user's request to withdraw funds from their wallet."""

    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="withdrawals",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True
    )
    payment_method = models.CharField(max_length=100, blank=True)
    payment_details = models.JSONField(default=dict, blank=True)
    admin_note = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="reviewed_withdrawals",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "withdrawal"
        verbose_name_plural = "withdrawals"
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self):
        return f"{self.user} | {self.amount} [{self.status}]"


class ManualPayout(models.Model):
    """
    Admin-created payout entries that appear in the public landing-page ticker
    alongside real approved withdrawals. Useful for seeding social proof.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=100, help_text="Display name shown on landing page (will be masked).")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payout_date = models.DateTimeField(default=timezone.now, help_text="Date/time shown on landing page.")
    is_active = models.BooleanField(default=True, help_text="Only active entries appear on the landing page.")
    note = models.CharField(max_length=255, blank=True, help_text="Internal admin note (never shown publicly).")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-payout_date"]
        verbose_name = "manual payout"
        verbose_name_plural = "manual payouts"

    def __str__(self):
        return f"{self.username} | ${self.amount} | {'active' if self.is_active else 'hidden'}"


class SiteSetting(models.Model):
    """Key-value store for editable platform settings."""

    key = models.CharField(max_length=100, unique=True, db_index=True)
    value = models.TextField(blank=True)
    label = models.CharField(max_length=255, blank=True, help_text="Human-readable label for admin UI.")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["key"]
        verbose_name = "site setting"
        verbose_name_plural = "site settings"

    def __str__(self):
        return f"{self.key} = {self.value[:60]}"


class MemberStory(models.Model):
    """
    Testimonial cards displayed on the public landing page.
    Fully managed via admin CRUD — no code change needed to update them.
    """

    COLOR_CHOICES = [
        ("from-violet-500 to-violet-700",  "Violet"),
        ("from-emerald-500 to-emerald-700", "Emerald"),
        ("from-pink-500 to-pink-700",       "Pink"),
        ("from-amber-500 to-amber-700",     "Amber"),
        ("from-cyan-500 to-cyan-700",       "Cyan"),
        ("from-rose-500 to-rose-700",       "Rose"),
        ("from-blue-500 to-blue-700",       "Blue"),
        ("from-indigo-500 to-indigo-700",   "Indigo"),
        ("from-teal-500 to-teal-700",       "Teal"),
        ("from-orange-500 to-orange-700",   "Orange"),
    ]

    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name            = models.CharField(max_length=100, help_text="Display name, e.g. 'Sarah K.'")
    avatar_initials = models.CharField(max_length=4,  help_text="2–4 letters shown in avatar circle, e.g. 'SK'")
    avatar_color    = models.CharField(
        max_length=60,
        choices=COLOR_CHOICES,
        default="from-violet-500 to-violet-700",
        help_text="Tailwind gradient for the avatar background.",
    )
    earned_amount   = models.CharField(max_length=20, help_text="Display string, e.g. '$420'")
    months_active   = models.PositiveSmallIntegerField(default=1, help_text="Months active on platform.")
    quote           = models.TextField(help_text="Testimonial text shown on landing page.")
    is_active       = models.BooleanField(default=True, help_text="Only active stories appear publicly.")
    sort_order      = models.PositiveSmallIntegerField(
        default=0, db_index=True,
        help_text="Lower numbers appear first. Ties broken by creation date.",
    )
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "created_at"]
        verbose_name = "member story"
        verbose_name_plural = "member stories"

    def __str__(self):
        return f"{self.name} — {self.earned_amount}"
