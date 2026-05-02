from django.contrib import admin
from .models import VIPPlan, Transaction, Withdrawal


@admin.register(VIPPlan)
class VIPPlanAdmin(admin.ModelAdmin):
    list_display = ("level", "name", "min_deposit", "daily_task_limit", "is_active", "created_at")
    list_filter = ("is_active",)
    ordering = ("level",)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("user", "type", "amount", "description", "created_at")
    list_filter = ("type",)
    search_fields = ("user__email", "user__username", "description")
    raw_id_fields = ("user",)
    ordering = ("-created_at",)


@admin.register(Withdrawal)
class WithdrawalAdmin(admin.ModelAdmin):
    list_display = ("user", "amount", "status", "payment_method", "reviewed_at", "created_at")
    list_filter = ("status",)
    search_fields = ("user__email", "user__username")
    raw_id_fields = ("user",)
    ordering = ("-created_at",)
