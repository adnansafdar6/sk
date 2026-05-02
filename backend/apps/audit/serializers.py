from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import AuditLog

User = get_user_model()

class AuditLogActorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']

class AuditLogSerializer(serializers.ModelSerializer):
    actor_details = AuditLogActorSerializer(source='actor', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'actor', 'actor_details', 'action', 'ip_address',
            'content_type', 'object_id', 'object_repr', 'changes', 'timestamp'
        ]
        read_only_fields = fields
