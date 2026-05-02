from django.urls import path
from .views import (
    PublicPlanListView,
    PublicPaymentWalletListView,
    AdminPlanListView,
    AdminPlanDetailView,
    AdminPlanToggleView,
    AdminPlanToggleFeaturedView,
    AdminPaymentWalletListView,
    AdminPaymentWalletDetailView,
    AdminPaymentWalletToggleView,
    SubmitPlanPurchaseView,
    MyPlanPurchasesView,
    AdminPlanPurchaseListView,
    AdminConfirmPurchaseView,
    AdminRejectPurchaseView,
)

urlpatterns = [
    # Public (no auth)
    path("public/",                                 PublicPlanListView.as_view(),           name="public-plan-list"),
    path("public/wallets/",                         PublicPaymentWalletListView.as_view(),  name="public-payment-wallet-list"),

    # User — plan purchases
    path("purchases/",                              SubmitPlanPurchaseView.as_view(),       name="submit-plan-purchase"),
    path("purchases/my/",                           MyPlanPurchasesView.as_view(),          name="my-plan-purchases"),

    # Admin — plans
    path("admin/",                                  AdminPlanListView.as_view(),            name="admin-plan-list"),
    path("admin/<uuid:pk>/",                        AdminPlanDetailView.as_view(),          name="admin-plan-detail"),
    path("admin/<uuid:pk>/toggle/",                 AdminPlanToggleView.as_view(),          name="admin-plan-toggle"),
    path("admin/<uuid:pk>/toggle-featured/",        AdminPlanToggleFeaturedView.as_view(),  name="admin-plan-toggle-featured"),

    # Admin — payment wallets
    path("admin/wallets/",                          AdminPaymentWalletListView.as_view(),   name="admin-wallet-list"),
    path("admin/wallets/<uuid:pk>/",                AdminPaymentWalletDetailView.as_view(), name="admin-wallet-detail"),
    path("admin/wallets/<uuid:pk>/toggle/",         AdminPaymentWalletToggleView.as_view(), name="admin-wallet-toggle"),

    # Admin — plan purchases
    path("admin/purchases/",                        AdminPlanPurchaseListView.as_view(),    name="admin-purchase-list"),
    path("admin/purchases/<uuid:pk>/confirm/",      AdminConfirmPurchaseView.as_view(),     name="admin-purchase-confirm"),
    path("admin/purchases/<uuid:pk>/reject/",       AdminRejectPurchaseView.as_view(),      name="admin-purchase-reject"),
]
