"""
RBAC URL patterns.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

app_name = "rbac"

router = DefaultRouter()
router.register(r"roles", views.RoleViewSet, basename="role")
router.register(r"permissions", views.PermissionViewSet, basename="permission")
router.register(r"users", views.AdminUserViewSet, basename="user")

urlpatterns = [
    path("", include(router.urls)),
    path("assign-role/", views.AssignRoleView.as_view(), name="assign-role"),
    path("revoke-role/", views.RevokeRoleView.as_view(), name="revoke-role"),
    path("my-permissions/", views.MyPermissionsView.as_view(), name="my-permissions"),
]
