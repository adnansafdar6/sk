from django.urls import path
from .views import (
    TaskListView,
    SubmitTaskView,
    MyCompletionsView,
    AdminTaskViewSet,
    AdminTaskDetailView,
    AdminTaskToggleStatusView,
    AdminCompletionListView,
    AdminApproveCompletionView,
    AdminRejectCompletionView,
)

urlpatterns = [
    # User endpoints
    path("", TaskListView.as_view(), name="task-list"),
    path("submit/", SubmitTaskView.as_view(), name="task-submit"),
    path("my-completions/", MyCompletionsView.as_view(), name="my-completions"),

    # Admin endpoints
    path("admin/", AdminTaskViewSet.as_view(), name="admin-task-list"),
    path("admin/<uuid:pk>/", AdminTaskDetailView.as_view(), name="admin-task-detail"),
    path("admin/<uuid:pk>/toggle-status/", AdminTaskToggleStatusView.as_view(), name="admin-task-toggle"),
    path("admin/completions/", AdminCompletionListView.as_view(), name="admin-completion-list"),
    path("admin/completions/<uuid:pk>/approve/", AdminApproveCompletionView.as_view(), name="admin-completion-approve"),
    path("admin/completions/<uuid:pk>/reject/", AdminRejectCompletionView.as_view(), name="admin-completion-reject"),
]