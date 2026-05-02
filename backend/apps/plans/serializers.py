from rest_framework import serializers
from .models import Plan, PaymentWallet, PlanPurchase


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = (
            "id", "name", "slug", "description",
            "price", "duration_days", "daily_earnings", "total_return",
            "features", "is_active", "is_featured", "sort_order",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "slug", "created_at", "updated_at")

    def validate_features(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Features must be a list of strings.")
        if any(not isinstance(f, str) or not f.strip() for f in value):
            raise serializers.ValidationError("Each feature must be a non-empty string.")
        return [f.strip() for f in value]

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value

    def validate_daily_earnings(self, value):
        if value < 0:
            raise serializers.ValidationError("Daily earnings cannot be negative.")
        return value

    def validate_total_return(self, value):
        if value < 0:
            raise serializers.ValidationError("Total return cannot be negative.")
        return value


class PaymentWalletSerializer(serializers.ModelSerializer):
    network_display = serializers.CharField(source="get_network_display", read_only=True)

    class Meta:
        model = PaymentWallet
        fields = (
            "id", "label", "network", "network_display",
            "address", "is_active", "sort_order",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "network_display", "created_at", "updated_at")

    def validate_address(self, value):
        value = value.strip()
        if len(value) < 10:
            raise serializers.ValidationError("Enter a valid wallet address.")
        return value


class PlanPurchaseSerializer(serializers.ModelSerializer):
    user_email      = serializers.EmailField(source="user.email", read_only=True)
    reviewed_by_email = serializers.EmailField(source="reviewed_by.email", read_only=True, default=None)
    wallet_address  = serializers.CharField(source="payment_wallet.address", read_only=True, default=None)
    wallet_network  = serializers.CharField(source="payment_wallet.get_network_display", read_only=True, default=None)

    class Meta:
        model = PlanPurchase
        fields = (
            "id", "user", "user_email",
            "plan", "plan_name", "amount_paid",
            "payment_wallet", "wallet_address", "wallet_network",
            "tx_hash", "notes",
            "status", "admin_note",
            "reviewed_by", "reviewed_by_email", "reviewed_at",
            "created_at",
        )
        read_only_fields = (
            "id", "user", "user_email", "plan_name",
            "wallet_address", "wallet_network",
            "status", "admin_note",
            "reviewed_by", "reviewed_by_email", "reviewed_at",
            "created_at",
        )


class SubmitPlanPurchaseSerializer(serializers.Serializer):
    plan_id        = serializers.UUIDField()
    payment_wallet = serializers.UUIDField()
    tx_hash        = serializers.CharField(max_length=255)
    notes          = serializers.CharField(max_length=1000, required=False, allow_blank=True, default="")

    def validate_tx_hash(self, value):
        value = value.strip()
        if len(value) < 8:
            raise serializers.ValidationError("Enter a valid transaction hash.")
        return value
