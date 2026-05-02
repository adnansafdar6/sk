"""
Plans — admin-managed investment / subscription plans shown to users.
PaymentWallet — deposit addresses shown on the payment page.
PlanPurchase — user payment submissions awaiting admin confirmation.
"""
import uuid
from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Plan(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="Plan cost in USDT.",
    )
    duration_days = models.PositiveIntegerField(
        default=30,
        help_text="How many days the plan is active after purchase.",
    )
    daily_earnings = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Estimated earnings per day in USDT.",
    )
    total_return = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Total return over the plan duration.",
    )
    features = models.JSONField(
        default=list, blank=True,
        help_text="List of feature strings displayed on the plan card.",
    )
    is_active = models.BooleanField(default=True, db_index=True)
    is_featured = models.BooleanField(
        default=False,
        help_text="Featured plans are highlighted on the plans page.",
    )
    sort_order = models.PositiveSmallIntegerField(
        default=0, db_index=True,
        help_text="Lower numbers appear first. Ties broken by name.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name = "plan"
        verbose_name_plural = "plans"

    def __str__(self):
        return f"{self.name} (${self.price})"

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name)
            slug = base
            n = 1
            while Plan.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{n}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)


class PaymentWallet(models.Model):
    """Admin-managed USDT wallet addresses displayed on the customer payment page."""

    NETWORK_TRC20 = "USDT_TRC20"
    NETWORK_ERC20 = "USDT_ERC20"
    NETWORK_BEP20 = "USDT_BEP20"
    NETWORK_CHOICES = [
        (NETWORK_TRC20, "USDT — TRC20 (Tron)"),
        (NETWORK_ERC20, "USDT — ERC20 (Ethereum)"),
        (NETWORK_BEP20, "USDT — BEP20 (BSC)"),
    ]

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    label      = models.CharField(max_length=100, help_text="Display name, e.g. 'Main Deposit Wallet'.")
    network    = models.CharField(max_length=20, choices=NETWORK_CHOICES, default=NETWORK_TRC20)
    address    = models.CharField(max_length=255, help_text="The crypto wallet address.")
    is_active  = models.BooleanField(default=True, db_index=True)
    sort_order = models.PositiveSmallIntegerField(default=0, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "label"]
        verbose_name = "payment wallet"
        verbose_name_plural = "payment wallets"

    def __str__(self):
        return f"{self.label} ({self.get_network_display()})"


class PlanPurchase(models.Model):
    """A user's payment submission for a plan, pending admin confirmation."""

    STATUS_PENDING   = "pending"
    STATUS_CONFIRMED = "confirmed"
    STATUS_REJECTED  = "rejected"
    STATUS_CHOICES   = [
        (STATUS_PENDING,   "Pending"),
        (STATUS_CONFIRMED, "Confirmed"),
        (STATUS_REJECTED,  "Rejected"),
    ]

    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user            = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="plan_purchases")
    plan            = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, related_name="purchases")
    plan_name       = models.CharField(max_length=100, help_text="Snapshot of plan name at submission time.")
    amount_paid     = models.DecimalField(max_digits=12, decimal_places=2, help_text="Amount user claims to have sent.")
    payment_wallet  = models.ForeignKey(PaymentWallet, null=True, blank=True, on_delete=models.SET_NULL, related_name="purchases")
    tx_hash         = models.CharField(max_length=255, help_text="Transaction hash / ID provided by user.")
    notes           = models.TextField(blank=True, help_text="Optional note from user.")
    status          = models.CharField(max_length=12, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True)
    admin_note      = models.TextField(blank=True)
    reviewed_by     = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="reviewed_purchases")
    reviewed_at     = models.DateTimeField(null=True, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "plan purchase"
        verbose_name_plural = "plan purchases"
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self):
        return f"{self.user} → {self.plan_name} [{self.status}]"
