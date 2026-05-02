from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser
from .models import Category
from .serializers import CategorySerializer, CategoryCreateUpdateSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Categories. 
    Public (or authenticated) can read. Admins can create/edit/delete.
    """
    queryset = Category.objects.filter(is_active=True).prefetch_related("subcategories")
    
    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdminUser()]
        return [IsAuthenticatedOrReadOnly()]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return CategoryCreateUpdateSerializer
        return CategorySerializer

    def get_queryset(self):
        if self.request.user.is_staff:
            return Category.objects.prefetch_related("subcategories").all()
        return super().get_queryset()
