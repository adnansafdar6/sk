from django.urls import path
from .views import (
    PublicSettingsView,
    PublicStatsView,
    PublicPayoutsView,
    WalletBalanceView,
    MyTransactionsView,
    MyWithdrawalsView,
    RequestWithdrawalView,
    VIPPlanListView,
    AdminDashboardStatsView,
    AdminTransactionListView,
    AdminWithdrawalListView,
    AdminApproveWithdrawalView,
    AdminRejectWithdrawalView,
    AdminBulkApproveWithdrawalView,
    AdminSiteSettingsView,
    AdminVIPPlanViewSet,
    AdminVIPPlanDetailView,
    AdminManualPayoutListView,
    AdminManualPayoutDetailView,
    AdminManualPayoutToggleView,
    PublicMemberStoriesView,
    AdminMemberStoryListView,
    AdminMemberStoryDetailView,
    AdminMemberStoryToggleView,
)

urlpatterns = [
    # Fully public (no auth required)
    path("public/settings/",       PublicSettingsView.as_view(),      name="public-settings"),
    path("public/stats/",          PublicStatsView.as_view(),         name="public-stats"),
    path("public/payouts/",        PublicPayoutsView.as_view(),       name="public-payouts"),
    path("public/member-stories/", PublicMemberStoriesView.as_view(), name="public-member-stories"),

    # User endpoints
    path("balance/", WalletBalanceView.as_view(), name="wallet-balance"),
    path("transactions/", MyTransactionsView.as_view(), name="my-transactions"),
    path("withdrawals/", MyWithdrawalsView.as_view(), name="my-withdrawals"),
    path("withdrawals/request/", RequestWithdrawalView.as_view(), name="withdrawal-request"),
    path("vip-plans/", VIPPlanListView.as_view(), name="vip-plan-list"),

    # Admin endpoints
    path("admin/stats/", AdminDashboardStatsView.as_view(), name="admin-dashboard-stats"),
    path("admin/transactions/", AdminTransactionListView.as_view(), name="admin-transaction-list"),
    path("admin/withdrawals/", AdminWithdrawalListView.as_view(), name="admin-withdrawal-list"),
    path("admin/withdrawals/bulk-approve/", AdminBulkApproveWithdrawalView.as_view(), name="admin-withdrawal-bulk-approve"),
    path("admin/withdrawals/<uuid:pk>/approve/", AdminApproveWithdrawalView.as_view(), name="admin-withdrawal-approve"),
    path("admin/withdrawals/<uuid:pk>/reject/", AdminRejectWithdrawalView.as_view(), name="admin-withdrawal-reject"),
    path("admin/settings/",  AdminSiteSettingsView.as_view(), name="admin-site-settings"),
    path("admin/vip-plans/", AdminVIPPlanViewSet.as_view(),   name="admin-vip-plan-list"),
    path("admin/vip-plans/<uuid:pk>/", AdminVIPPlanDetailView.as_view(), name="admin-vip-plan-detail"),

    # Manual payout display management
    path("admin/manual-payouts/",                              AdminManualPayoutListView.as_view(),   name="admin-manual-payout-list"),
    path("admin/manual-payouts/<uuid:pk>/",                    AdminManualPayoutDetailView.as_view(), name="admin-manual-payout-detail"),
    path("admin/manual-payouts/<uuid:pk>/toggle/",             AdminManualPayoutToggleView.as_view(), name="admin-manual-payout-toggle"),

    # Member stories (landing page testimonials)
    path("admin/member-stories/",                              AdminMemberStoryListView.as_view(),   name="admin-member-story-list"),
    path("admin/member-stories/<uuid:pk>/",                    AdminMemberStoryDetailView.as_view(), name="admin-member-story-detail"),
    path("admin/member-stories/<uuid:pk>/toggle/",             AdminMemberStoryToggleView.as_view(), name="admin-member-story-toggle"),
]
