from decimal import Decimal
from rest_framework import serializers
from .models import VIPPlan, Transaction, Withdrawal, SiteSetting, ManualPayout, MemberStory


class VIPPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = VIPPlan
        fields = (
            "id", "level", "name", "min_deposit",
            "daily_task_limit", "description", "is_active", "created_at",
        )
        read_only_fields = ("id", "created_at")


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ("id", "user", "type", "amount", "description", "created_at")
        read_only_fields = ("id", "user", "created_at")


class WithdrawalSerializer(serializers.ModelSerializer):
    wallet_address    = serializers.SerializerMethodField()
    user_email        = serializers.SerializerMethodField()
    reviewed_by_email = serializers.SerializerMethodField()

    def get_user_email(self, obj):
        return obj.user.email if obj.user_id else None

    def get_reviewed_by_email(self, obj):
        return obj.reviewed_by.email if obj.reviewed_by_id else None

    class Meta:
        model = Withdrawal
        fields = (
            "id", "user", "user_email", "amount", "status", "payment_method",
            "wallet_address", "payment_details", "admin_note",
            "reviewed_by", "reviewed_by_email", "reviewed_at", "created_at",
        )
        read_only_fields = (
            "id", "user", "user_email", "status", "admin_note",
            "reviewed_by", "reviewed_by_email", "reviewed_at", "created_at",
        )

    def get_wallet_address(self, obj):
        details = obj.payment_details or {}
        return details.get("address", "") if isinstance(details, dict) else ""


class WithdrawalRequestSerializer(serializers.Serializer):
    """Used when a user submits a withdrawal request."""
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("1.00"))
    wallet_address = serializers.CharField(
        max_length=255,
        help_text="TRC20 USDT wallet address.",
    )

    def validate_wallet_address(self, value):
        value = value.strip()
        if len(value) < 10:
            raise serializers.ValidationError("Please enter a valid TRC20 wallet address.")
        return value


class SiteSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSetting
        fields = ("key", "value", "label", "updated_at")
        read_only_fields = ("key", "label", "updated_at")


class ManualPayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManualPayout
        fields = ("id", "username", "amount", "payout_date", "is_active", "note", "created_at")
        read_only_fields = ("id", "created_at")


class MemberStorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MemberStory
        fields = (
            "id", "name", "avatar_initials", "avatar_color",
            "earned_amount", "months_active", "quote",
            "is_active", "sort_order", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
