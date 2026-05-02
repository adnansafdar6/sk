"""
Task views — list available tasks and submit completions.
"""
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.rbac.permissions import IsAdmin
from apps.wallet.exceptions import TaskSubmitThrottle
from .models import Task, TaskCompletion
from .serializers import TaskSerializer, AdminTaskSerializer, TaskCompletionSerializer, SubmitTaskSerializer


# ─── Public / User endpoints ────────────────────────────────────────────────


class TaskListView(generics.ListAPIView):
    """GET /api/tasks/ — List active tasks accessible to the authenticated user."""

    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Task.objects.filter(
            status=Task.STATUS_ACTIVE,
            vip_level_required__lte=user.vip_level,
        )


class SubmitTaskView(APIView):
    """POST /api/tasks/submit/ — Submit a task completion for review."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [TaskSubmitThrottle]

    def post(self, request):
        serializer = SubmitTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        task_id = serializer.validated_data["task_id"]

        try:
            task = Task.objects.get(id=task_id, status=Task.STATUS_ACTIVE)
        except Task.DoesNotExist:
            return Response(
                {"detail": "Task not found or inactive."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if task.vip_level_required > user.vip_level:
            return Response(
                {"detail": f"This task requires VIP level {task.vip_level_required}."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Enforce daily limit
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_count = TaskCompletion.objects.filter(
            user=user, task=task, created_at__gte=today_start
        ).exclude(status=TaskCompletion.STATUS_REJECTED).count()

        if today_count >= task.daily_limit:
            return Response(
                {"detail": f"Daily limit of {task.daily_limit} reached for this task."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        completion = TaskCompletion.objects.create(
            user=user,
            task=task,
            status=TaskCompletion.STATUS_PENDING,
            earned_amount=0,
        )
        return Response(
            TaskCompletionSerializer(completion).data,
            status=status.HTTP_201_CREATED,
        )


class MyCompletionsView(generics.ListAPIView):
    """GET /api/tasks/my-completions/ — List the authenticated user's completions."""

    serializer_class = TaskCompletionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return TaskCompletion.objects.filter(
            user=self.request.user
        ).select_related("user", "task").order_by("-created_at")


# ─── Admin endpoints ────────────────────────────────────────────────────────


class AdminTaskViewSet(generics.ListCreateAPIView):
    """GET/POST /api/tasks/admin/ — Manage tasks (admin only)."""

    queryset = Task.objects.all()
    serializer_class = AdminTaskSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = None


class AdminTaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/tasks/admin/<id>/ — Task detail (admin only)."""

    queryset = Task.objects.all()
    serializer_class = AdminTaskSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = None


class AdminTaskToggleStatusView(APIView):
    """POST /api/tasks/admin/<id>/toggle-status/ — Toggle active/inactive."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            task = Task.objects.get(pk=pk)
        except Task.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        task.status = (
            Task.STATUS_INACTIVE if task.status == Task.STATUS_ACTIVE else Task.STATUS_ACTIVE
        )
        task.save(update_fields=["status"])
        return Response({"detail": f"Task status set to '{task.status}'.", "status": task.status})


class AdminCompletionListView(generics.ListAPIView):
    """GET /api/tasks/admin/completions/ — All completions (admin only)."""

    queryset = (
        TaskCompletion.objects
        .all()
        .select_related("user", "task")
        .order_by("-created_at")
    )
    serializer_class = TaskCompletionSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = None


class AdminApproveCompletionView(APIView):
    """POST /api/tasks/admin/completions/<id>/approve/ — Approve a pending completion."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            completion = TaskCompletion.objects.select_related("user", "task").get(pk=pk)
        except TaskCompletion.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if completion.status != TaskCompletion.STATUS_PENDING:
            return Response(
                {"detail": f"Completion is already '{completion.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        completion.mark_completed()

        # Credit wallet atomically and create a transaction record
        from django.db.models import F
        from apps.wallet.models import Transaction

        user = completion.user
        # Use F() expression so concurrent approvals don't race-condition the balance
        type(user).objects.filter(pk=user.pk).update(
            wallet_balance=F("wallet_balance") + completion.earned_amount
        )

        Transaction.objects.create(
            user=user,
            type=Transaction.TYPE_EARNING,
            amount=completion.earned_amount,
            description=f"Task reward: {completion.task.title}",
        )

        return Response(
            TaskCompletionSerializer(completion).data,
            status=status.HTTP_200_OK,
        )


class AdminRejectCompletionView(APIView):
    """POST /api/tasks/admin/completions/<id>/reject/ — Reject a pending completion."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            completion = TaskCompletion.objects.get(pk=pk)
        except TaskCompletion.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if completion.status != TaskCompletion.STATUS_PENDING:
            return Response(
                {"detail": f"Completion is already '{completion.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        completion.status = TaskCompletion.STATUS_REJECTED
        completion.save(update_fields=["status"])

        return Response(
            TaskCompletionSerializer(completion).data,
            status=status.HTTP_200_OK,
        )