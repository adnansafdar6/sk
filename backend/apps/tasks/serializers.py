from django.db.models import Sum, Count
from rest_framework import serializers
from .models import Task, TaskCompletion


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = (
            "id", "title", "description", "instructions",
            "reward_amount", "daily_limit", "vip_level_required",
            "status", "created_at",
        )
        read_only_fields = ("id", "created_at")


class AdminTaskSerializer(serializers.ModelSerializer):
    """Task serializer with completion stats for admin views."""

    completions_count = serializers.SerializerMethodField()
    total_distributed = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = (
            "id", "title", "description", "instructions",
            "reward_amount", "daily_limit", "vip_level_required",
            "status", "created_at", "updated_at",
            "completions_count", "total_distributed",
        )
        read_only_fields = ("id", "created_at", "updated_at", "completions_count", "total_distributed")

    def get_completions_count(self, obj):
        return obj.completions.filter(status=TaskCompletion.STATUS_COMPLETED).count()

    def get_total_distributed(self, obj):
        result = obj.completions.filter(
            status=TaskCompletion.STATUS_COMPLETED
        ).aggregate(total=Sum("earned_amount"))["total"]
        return float(result or 0)


class TaskCompletionSerializer(serializers.ModelSerializer):
    task_title  = serializers.CharField(source="task.title", read_only=True)
    task_reward = serializers.DecimalField(
        source="task.reward_amount", max_digits=10, decimal_places=2, read_only=True
    )
    user_email  = serializers.SerializerMethodField()

    def get_user_email(self, obj):
        return obj.user.email if obj.user_id else None

    class Meta:
        model = TaskCompletion
        fields = (
            "id", "user", "user_email", "task", "task_title", "task_reward",
            "status", "earned_amount", "completed_at", "created_at",
        )
        read_only_fields = ("id", "user", "user_email", "earned_amount", "completed_at", "created_at")


class SubmitTaskSerializer(serializers.Serializer):
    """Used when a user submits a task for review."""
    task_id = serializers.UUIDField()