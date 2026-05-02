from django.contrib import admin
from .models import Plan, PaymentWallet, PlanPurchase


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ("name", "price", "duration_days", "daily_earnings", "total_return", "is_active", "is_featured", "sort_order")
    list_filter = ("is_active", "is_featured")
    search_fields = ("name", "description")
    readonly_fields = ("id", "slug", "created_at", "updated_at")
    list_editable = ("is_active", "is_featured", "sort_order")
    ordering = ("sort_order", "name")


@admin.register(PaymentWallet)
class PaymentWalletAdmin(admin.ModelAdmin):
    list_display = ("label", "network", "address", "is_active", "sort_order")
    list_filter = ("network", "is_active")
    search_fields = ("label", "address")
    list_editable = ("is_active", "sort_order")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(PlanPurchase)
class PlanPurchaseAdmin(admin.ModelAdmin):
    list_display = ("user", "plan_name", "amount_paid", "status", "tx_hash", "created_at")
    list_filter = ("status",)
    search_fields = ("user__email", "plan_name", "tx_hash")
    readonly_fields = ("id", "user", "plan", "plan_name", "amount_paid", "payment_wallet", "tx_hash", "notes", "created_at")
    raw_id_fields = ("reviewed_by",)
