"""
Root URL configuration.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/rbac/", include("apps.rbac.urls")),
    path("api/audit/", include("apps.audit.urls")),
    path("api/categories/", include("apps.categories.urls")),
    path("api/tasks/", include("apps.tasks.urls")),
    path("api/wallet/", include("apps.wallet.urls")),
    path("api/plans/", include("apps.plans.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
