"""
Management command: seed default roles and permissions.
Usage: python manage.py seed_rbac
"""
from django.core.management.base import BaseCommand

from apps.rbac.models import Role, Permission, RolePermission


# ──────────────────────────────────────────────
# Default permission definitions
# ──────────────────────────────────────────────
DEFAULT_PERMISSIONS = [
    # Users
    {"codename": "users.view", "name": "View Users", "category": "users"},
    {"codename": "users.create", "name": "Create Users", "category": "users"},
    {"codename": "users.edit", "name": "Edit Users", "category": "users"},
    {"codename": "users.delete", "name": "Delete Users", "category": "users"},
    # Roles
    {"codename": "roles.view", "name": "View Roles", "category": "roles"},
    {"codename": "roles.create", "name": "Create Roles", "category": "roles"},
    {"codename": "roles.edit", "name": "Edit Roles", "category": "roles"},
    {"codename": "roles.delete", "name": "Delete Roles", "category": "roles"},
    {"codename": "roles.assign", "name": "Assign Roles", "category": "roles"},
    # Content
    {"codename": "content.view", "name": "View Content", "category": "content"},
    {"codename": "content.create", "name": "Create Content", "category": "content"},
    {"codename": "content.edit", "name": "Edit Content", "category": "content"},
    {"codename": "content.delete", "name": "Delete Content", "category": "content"},
    {"codename": "content.publish", "name": "Publish Content", "category": "content"},
    # Dashboard
    {"codename": "dashboard.view", "name": "View Dashboard", "category": "dashboard"},
    {"codename": "dashboard.analytics", "name": "View Analytics", "category": "dashboard"},
    # Settings
    {"codename": "settings.view", "name": "View Settings", "category": "settings"},
    {"codename": "settings.edit", "name": "Edit Settings", "category": "settings"},
]

# ──────────────────────────────────────────────
# Default role definitions
# ──────────────────────────────────────────────
DEFAULT_ROLES = [
    {
        "name": "admin",
        "description": "Full system access. Can manage users, roles, permissions, content, and settings.",
        "is_default": False,
        "permissions": [p["codename"] for p in DEFAULT_PERMISSIONS],  # All permissions
    },
    {
        "name": "manager",
        "description": "Can manage content and view users. No access to role/permission management.",
        "is_default": False,
        "permissions": [
            "users.view",
            "content.view",
            "content.create",
            "content.edit",
            "content.delete",
            "content.publish",
            "dashboard.view",
            "dashboard.analytics",
        ],
    },
    {
        "name": "member",
        "description": "Basic access. Can view content and their own dashboard.",
        "is_default": True,
        "permissions": [
            "content.view",
            "content.create",
            "dashboard.view",
        ],
    },
]


class Command(BaseCommand):
    help = "Seed default roles and permissions for the RBAC system."

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("Seeding RBAC..."))

        # Create permissions
        perm_objects = {}
        for perm_data in DEFAULT_PERMISSIONS:
            perm, created = Permission.objects.get_or_create(
                codename=perm_data["codename"],
                defaults={
                    "name": perm_data["name"],
                    "category": perm_data["category"],
                },
            )
            perm_objects[perm.codename] = perm
            status_label = "CREATED" if created else "EXISTS"
            self.stdout.write(f"  Permission: {perm.codename} [{status_label}]")

        # Create roles and assign permissions
        for role_data in DEFAULT_ROLES:
            role, created = Role.objects.get_or_create(
                name=role_data["name"],
                defaults={
                    "description": role_data["description"],
                    "is_default": role_data["is_default"],
                },
            )
            status_label = "CREATED" if created else "EXISTS"
            self.stdout.write(f"  Role: {role.name} [{status_label}]")

            # Assign permissions to role
            for codename in role_data["permissions"]:
                perm = perm_objects.get(codename)
                if perm:
                    RolePermission.objects.get_or_create(role=role, permission=perm)

        self.stdout.write(self.style.SUCCESS("\n✓ RBAC seeding completed successfully."))
