from django.contrib import admin
from .models import Task, TaskCompletion


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "reward_amount", "daily_limit", "vip_level_required", "status", "created_at")
    list_filter = ("status", "vip_level_required")
    search_fields = ("title", "description")
    ordering = ("-created_at",)


@admin.register(TaskCompletion)
class TaskCompletionAdmin(admin.ModelAdmin):
    list_display = ("user", "task", "status", "earned_amount", "completed_at", "created_at")
    list_filter = ("status",)
    search_fields = ("user__email", "user__username", "task__title")
    raw_id_fields = ("user", "task")
    ordering = ("-created_at",)