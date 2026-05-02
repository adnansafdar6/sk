"""
Custom user model — email + username dual-identifier authentication.
"""
import uuid
import random
import string
from decimal import Decimal

from django.contrib.auth.models import AbstractUser
from django.db import models

from .managers import CustomUserManager


def _generate_referral_code():
    """Return a unique 8-character uppercase alphanumeric referral code."""
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=8))


class CustomUser(AbstractUser):
    """
    Extended user model with email-based auth, RBAC roles, VIP tiers,
    wallet balance, and referral system.
    """

    ROLE_CHOICES = [
        ("user", "User"),
        ("admin", "Admin"),
    ]
    STATUS_CHOICES = [
        ("active", "Active"),
        ("banned", "Banned"),
        ("suspended", "Suspended"),
    ]
    VIP_CHOICES = [
        (0, "Regular"),
        (1, "VIP 1"),
        (2, "VIP 2"),
        (3, "VIP 3"),
    ]

    # ── Core identifiers ────────────────────────────────────────────────
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(
        "username",
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        db_index=True,
        help_text="Optional unique display name / login handle.",
    )
    email = models.EmailField("email address", unique=True, db_index=True)
    phone = models.CharField("phone number", max_length=20, blank=True, db_index=True)

    # ── Profile ─────────────────────────────────────────────────────────
    bio = models.TextField("bio", max_length=500, blank=True)
    avatar = models.ImageField("avatar", upload_to="avatars/", blank=True, null=True)
    date_of_birth = models.DateField("date of birth", blank=True, null=True)

    # ── Role & status ────────────────────────────────────────────────────
    role = models.CharField(
        "role", max_length=10, choices=ROLE_CHOICES, default="user", db_index=True
    )
    status = models.CharField(
        "status", max_length=12, choices=STATUS_CHOICES, default="active", db_index=True
    )
    is_email_verified = models.BooleanField("email verified", default=False)

    # ── VIP & wallet ─────────────────────────────────────────────────────
    vip_level = models.IntegerField(
        "VIP level", choices=VIP_CHOICES, default=0, db_index=True
    )
    wallet_balance = models.DecimalField(
        "wallet balance", max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    referral_code = models.CharField(
        "referral code", max_length=12, unique=True, blank=True, 
    )

    # ── Timestamps ───────────────────────────────────────────────────────
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = CustomUserManager()

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"
        ordering = ["-date_joined"]

    def __str__(self):
        return self.username or self.email

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def save(self, *args, **kwargs):
        # Auto-generate a unique referral code on first save.
        if not self.referral_code:
            code = _generate_referral_code()
            while CustomUser.objects.filter(referral_code=code).exists():
                code = _generate_referral_code()
            self.referral_code = code

        # Keep is_active in sync with status so Django's auth checks stay valid.
        self.is_active = self.status == "active"

        super().save(*args, **kwargs)