from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.rbac.permissions import IsAdmin
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListView(generics.ListAPIView):
    """
    GET /api/audit/logs/
    List all audit logs. Restricted to users with the 'admin' RBAC role.
    Supports filtering by action/actor and full-text search.
    """

    queryset = AuditLog.objects.all().select_related('actor')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['action', 'actor']
    search_fields = ['object_repr', 'ip_address']
    ordering_fields = ['timestamp', 'action']
    ordering = ['-timestamp']


class AuditLogDetailView(generics.RetrieveAPIView):
    """
    GET /api/audit/logs/<id>/
    Retrieve a specific audit log entry.
    """

    queryset = AuditLog.objects.all().select_related('actor')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
