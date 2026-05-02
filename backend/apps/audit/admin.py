from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'actor', 'action', 'object_repr', 'ip_address')
    list_filter = ('action', 'timestamp')
    search_fields = ('actor__email', 'object_repr', 'ip_address')
    readonly_fields = [f.name for f in AuditLog._meta.fields]
    
    # Audit logs should be read-only to guarantee integrity
    def has_add_permission(self, request):
        return False
        
    def has_change_permission(self, request, obj=None):
        return False
        
    def has_delete_permission(self, request, obj=None):
        return False
