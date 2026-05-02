from rest_framework import serializers
from .models import Category

class CategorySerializer(serializers.ModelSerializer):
    """Serializer for the Category model, including children/parent relations."""
    subcategories = serializers.SerializerMethodField()
    parent_name = serializers.CharField(source="parent.name", read_only=True)

    class Meta:
        model = Category
        fields = (
            "id", "name", "slug", "description", "image", 
            "parent", "parent_name", "is_active", 
            "created_at", "updated_at", "subcategories"
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_subcategories(self, obj):
        if obj.subcategories.exists():
            return CategorySerializer(obj.subcategories.all(), many=True, context=self.context).data
        return []

class CategoryCreateUpdateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creation and updates by admins."""
    class Meta:
        model = Category
        fields = (
            "id", "name", "slug", "description", "image", 
            "parent", "is_active"
        )
