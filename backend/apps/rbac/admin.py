"""
Admin registration for RBAC models.
"""
from django.contrib import admin

from .models import Role, Permission, RolePermission, UserRole


class RolePermissionInline(admin.TabularInline):
    model = RolePermission
    extra = 1
    autocomplete_fields = ["permission"]


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "is_default", "created_at")
    list_filter = ("is_default",)
    search_fields = ("name",)
    inlines = [RolePermissionInline]


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ("codename", "name", "category")
    list_filter = ("category",)
    search_fields = ("codename", "name")


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "assigned_at", "assigned_by")
    list_filter = ("role",)
    search_fields = ("user__email", "role__name")
    autocomplete_fields = ["user", "role"]
