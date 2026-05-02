"""
Tasks models — Task definitions and per-user completion records.
"""
import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class Task(models.Model):
    """A task users can complete to earn rewards."""

    STATUS_ACTIVE = "active"
    STATUS_INACTIVE = "inactive"
    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_INACTIVE, "Inactive"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)
    instructions = models.TextField(
        blank=True, help_text="Step-by-step instructions shown to the user."
    )
    reward_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Amount credited to the user's wallet on completion.",
    )
    daily_limit = models.PositiveIntegerField(
        default=1,
        help_text="Maximum number of times a single user may complete this task per day.",
    )
    vip_level_required = models.IntegerField(
        default=0,
        db_index=True,
        help_text="Minimum VIP level needed. 0 = open to all users.",
    )
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default=STATUS_ACTIVE, db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "task"
        verbose_name_plural = "tasks"
        indexes = [
            models.Index(fields=["status", "vip_level_required"]),
        ]

    def __str__(self):
        return self.title


class TaskCompletion(models.Model):
    """Records a single attempt/completion of a task by a user."""

    STATUS_PENDING = "pending"
    STATUS_COMPLETED = "completed"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_REJECTED, "Rejected"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="task_completions",
    )
    task = models.ForeignKey(
        Task, on_delete=models.CASCADE, related_name="completions"
    )
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True
    )
    earned_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "task completion"
        verbose_name_plural = "task completions"
        indexes = [
            models.Index(fields=["user", "task"]),
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.user} — {self.task.title} [{self.status}]"

    def mark_completed(self, save=True):
        """Approve a completion and record the timestamp."""
        self.status = self.STATUS_COMPLETED
        self.earned_amount = self.task.reward_amount
        self.completed_at = timezone.now()
        if save:
            self.save(update_fields=["status", "earned_amount", "completed_at"])
