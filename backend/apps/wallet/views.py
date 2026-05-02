"""
Wallet views — balance, transactions, withdrawals, VIP plans.
"""
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.authentication import BasicAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.rbac.permissions import IsAdmin
from .models import VIPPlan, Transaction, Withdrawal, SiteSetting, ManualPayout, MemberStory
from .serializers import (
    VIPPlanSerializer,
    TransactionSerializer,
    WithdrawalSerializer,
    WithdrawalRequestSerializer,
    SiteSettingSerializer,
    ManualPayoutSerializer,
    MemberStorySerializer,
)

# ─── Setting helpers ─────────────────────────────────────────────────────────

# Keys that can be managed via the admin settings page.
MANAGED_SETTINGS = [
    {"key": "platform_name",        "label": "Platform Name",               "default": "EarnSK"},
    {"key": "hero_title",           "label": "Landing Hero Title",          "default": "Get paid daily in USDT crypto"},
    {"key": "hero_subtitle",        "label": "Landing Hero Subtitle",       "default": "Complete easy tasks, earn real USDT rewards, and withdraw directly to your TRC20 wallet — every single day."},
    {"key": "whatsapp_link",        "label": "WhatsApp Support Link",       "default": "https://wa.me/1234567890"},
    {"key": "welcome_bonus_amount", "label": "Welcome Bonus (USDT)",        "default": "0"},
    {"key": "min_withdrawal_amount","label": "Min Withdrawal Amount (USDT)","default": "10"},
]


def get_setting(key, default=None):
    """Read a setting from DB, fall back to Django settings, then to default."""
    try:
        return SiteSetting.objects.get(key=key).value
    except SiteSetting.DoesNotExist:
        # Fall back to Django settings
        django_val = getattr(settings, key.upper(), None)
        return str(django_val) if django_val is not None else (default or "")


# ─── Fully public endpoints (no JWT check) ──────────────────────────────────


def _mask_username(username):
    """Partially mask a username: 'johndoe' → 'jo***oe'."""
    if not username:
        return "user***"
    if len(username) <= 3:
        return username[0] + "***"
    return username[:2] + "***" + username[-1]


class PublicSettingsView(APIView):
    """GET /api/wallet/public/settings/ — Frontend-facing platform settings (no auth)."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({s["key"]: get_setting(s["key"], s["default"]) for s in MANAGED_SETTINGS})


class PublicStatsView(APIView):
    """GET /api/wallet/public/stats/ — Unauthenticated platform stats for landing page."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        from django.contrib.auth import get_user_model
        from django.db.models import Sum
        from apps.tasks.models import Task

        User = get_user_model()
        total_users = User.objects.filter(is_active=True).count()
        total_paid_out = (
            Transaction.objects
            .filter(type__in=[Transaction.TYPE_EARNING, Transaction.TYPE_BONUS])
            .aggregate(total=Sum("amount"))["total"] or 0
        )
        tasks_available = Task.objects.filter(status="active").count()

        return Response({
            "total_users":     total_users,
            "total_paid_out":  float(total_paid_out),
            "tasks_available": tasks_available,
            "whatsapp_link":   get_setting("whatsapp_link", getattr(settings, "WHATSAPP_LINK", "")),
        })


class PublicPayoutsView(APIView):
    """
    GET /api/wallet/public/payouts/ — Merged feed of real approved withdrawals
    and admin-created manual payout entries, sorted by date, max 30 entries.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        # Real approved withdrawals
        real = (
            Withdrawal.objects
            .filter(status=Withdrawal.STATUS_APPROVED)
            .select_related("user")
            .order_by("-reviewed_at")[:30]
        )
        real_data = [
            {
                "username":    _mask_username(w.user.username or w.user.email.split("@")[0]),
                "amount":      float(w.amount),
                "reviewed_at": (w.reviewed_at or w.created_at).isoformat(),
                "source":      "real",
            }
            for w in real
        ]

        # Admin manual payout entries
        manual = ManualPayout.objects.filter(is_active=True).order_by("-payout_date")[:30]
        manual_data = [
            {
                "username":    _mask_username(m.username),
                "amount":      float(m.amount),
                "reviewed_at": m.payout_date.isoformat(),
                "source":      "manual",
            }
            for m in manual
        ]

        # Merge, sort by date desc, cap at 30
        merged = sorted(real_data + manual_data, key=lambda x: x["reviewed_at"], reverse=True)[:30]
        # Remove internal source field before returning
        for item in merged:
            item.pop("source", None)

        return Response(merged)


# ─── Public / User endpoints ────────────────────────────────────────────────


class WalletBalanceView(APIView):
    """GET /api/wallet/balance/ — Return the authenticated user's wallet balance."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        min_amt = get_setting(
            "min_withdrawal_amount",
            str(getattr(settings, "MIN_WITHDRAWAL_AMOUNT", 10))
        )
        return Response({
            "wallet_balance": request.user.wallet_balance,
            "vip_level": request.user.vip_level,
            "min_withdrawal_amount": float(min_amt),
        })


class MyTransactionsView(generics.ListAPIView):
    """GET /api/wallet/transactions/ — List the authenticated user's transactions."""

    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)


class MyWithdrawalsView(generics.ListAPIView):
    """GET /api/wallet/withdrawals/ — List the authenticated user's withdrawal requests."""

    serializer_class = WithdrawalSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Return a flat list, not paginated

    def get_queryset(self):
        return Withdrawal.objects.filter(
            user=self.request.user
        ).select_related("user", "reviewed_by").order_by("-created_at")


class RequestWithdrawalView(APIView):
    """POST /api/wallet/withdrawals/request/ — Submit a withdrawal request."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = WithdrawalRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        amount = serializer.validated_data["amount"]
        wallet_address = serializer.validated_data["wallet_address"]

        min_amount = Decimal(
            get_setting("min_withdrawal_amount", str(getattr(settings, "MIN_WITHDRAWAL_AMOUNT", 10)))
        )
        if amount < min_amount:
            return Response(
                {"detail": f"Minimum withdrawal amount is ${min_amount:.2f} USDT."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if amount > user.wallet_balance:
            return Response(
                {"detail": "Insufficient wallet balance."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Deduct balance and create withdrawal record
        user.wallet_balance -= amount
        user.save(update_fields=["wallet_balance"])

        withdrawal = Withdrawal.objects.create(
            user=user,
            amount=amount,
            payment_method="USDT_TRC20",
            payment_details={"address": wallet_address},
        )

        Transaction.objects.create(
            user=user,
            type=Transaction.TYPE_WITHDRAWAL,
            amount=amount,
            description=f"Withdrawal request #{withdrawal.id}",
        )

        return Response(
            WithdrawalSerializer(withdrawal).data,
            status=status.HTTP_201_CREATED,
        )


class VIPPlanListView(APIView):
    """GET /api/wallet/vip-plans/ — List active VIP plans + WhatsApp upgrade link."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        plans = VIPPlan.objects.filter(is_active=True)
        return Response({
            "plans": VIPPlanSerializer(plans, many=True).data,
            "whatsapp_link": getattr(settings, "WHATSAPP_LINK", "https://wa.me/1234567890"),
        })


# ─── Admin endpoints ────────────────────────────────────────────────────────


class AdminDashboardStatsView(APIView):
    """GET /api/wallet/admin/stats/ — Aggregated stats for the admin dashboard."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from django.contrib.auth import get_user_model
        from django.db.models import Sum, Count
        from django.db.models.functions import TruncDate
        from apps.tasks.models import Task

        User = get_user_model()
        today = timezone.now().date()
        thirty_days_ago = today - timezone.timedelta(days=29)

        # ── Scalar stats ──────────────────────────────────────────────────────
        total_users  = User.objects.count()
        active_tasks = Task.objects.filter(status=Task.STATUS_ACTIVE).count()

        total_earnings = (
            Transaction.objects.filter(type__in=[Transaction.TYPE_EARNING, Transaction.TYPE_BONUS])
            .aggregate(total=Sum("amount"))["total"] or 0
        )

        pending_withdrawals = Withdrawal.objects.filter(status=Withdrawal.STATUS_PENDING)
        pending_count  = pending_withdrawals.count()
        pending_amount = pending_withdrawals.aggregate(total=Sum("amount"))["total"] or 0

        # Active today = users who have a task completion created today
        from apps.tasks.models import TaskCompletion
        active_today = (
            TaskCompletion.objects
            .filter(created_at__date=today)
            .values("user")
            .distinct()
            .count()
        )

        # ── Signup chart: last 30 days ─────────────────────────────────────
        signups_qs = (
            User.objects
            .filter(date_joined__date__gte=thirty_days_ago)
            .annotate(date=TruncDate("date_joined"))
            .values("date")
            .annotate(count=Count("id"))
            .order_by("date")
        )
        signup_map = {row["date"].isoformat(): row["count"] for row in signups_qs}

        # ── Earnings chart: last 30 days ───────────────────────────────────
        earnings_qs = (
            Transaction.objects
            .filter(
                type__in=[Transaction.TYPE_EARNING, Transaction.TYPE_BONUS],
                created_at__date__gte=thirty_days_ago,
            )
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(total=Sum("amount"))
            .order_by("date")
        )
        earnings_map = {row["date"].isoformat(): float(row["total"]) for row in earnings_qs}

        # Fill every day in the range (zero for missing days)
        chart_days = []
        for i in range(30):
            d = (thirty_days_ago + timezone.timedelta(days=i)).isoformat()
            chart_days.append({
                "date":     d,
                "signups":  signup_map.get(d, 0),
                "earnings": earnings_map.get(d, 0.0),
            })

        # ── Recent withdrawals (last 10) ───────────────────────────────────
        recent_withdrawals = (
            Withdrawal.objects
            .select_related("user", "reviewed_by")
            .order_by("-created_at")[:10]
        )

        return Response({
            "stats": {
                "total_users":      total_users,
                "active_today":     active_today,
                "total_earnings":   float(total_earnings),
                "pending_count":    pending_count,
                "pending_amount":   float(pending_amount),
                "active_tasks":     active_tasks,
            },
            "chart_data":          chart_days,
            "recent_withdrawals":  WithdrawalSerializer(recent_withdrawals, many=True).data,
        })


class AdminTransactionListView(generics.ListAPIView):
    """GET /api/wallet/admin/transactions/ — All transactions (admin only)."""

    queryset = Transaction.objects.all().select_related("user")
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated, IsAdmin]


class AdminWithdrawalListView(generics.ListAPIView):
    """GET /api/wallet/admin/withdrawals/ — All withdrawal requests (admin only)."""

    queryset = Withdrawal.objects.all().select_related("user", "reviewed_by")
    serializer_class = WithdrawalSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = None


class AdminApproveWithdrawalView(APIView):
    """POST /api/wallet/admin/withdrawals/<id>/approve/ — Approve a withdrawal."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            withdrawal = Withdrawal.objects.select_related("user", "reviewed_by").get(pk=pk)
        except Withdrawal.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if withdrawal.status != Withdrawal.STATUS_PENDING:
            return Response(
                {"detail": f"Withdrawal is already '{withdrawal.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        withdrawal.status = Withdrawal.STATUS_APPROVED
        withdrawal.reviewed_by = request.user
        withdrawal.reviewed_at = timezone.now()
        withdrawal.save(update_fields=["status", "reviewed_by", "reviewed_at"])

        return Response(WithdrawalSerializer(withdrawal).data)


class AdminRejectWithdrawalView(APIView):
    """POST /api/wallet/admin/withdrawals/<id>/reject/ — Reject and refund a withdrawal."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            withdrawal = Withdrawal.objects.select_related("user", "reviewed_by").get(pk=pk)
        except Withdrawal.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if withdrawal.status != Withdrawal.STATUS_PENDING:
            return Response(
                {"detail": f"Withdrawal is already '{withdrawal.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        admin_note = request.data.get("admin_note", "")

        # Refund the deducted balance
        user = withdrawal.user
        user.wallet_balance += withdrawal.amount
        user.save(update_fields=["wallet_balance"])

        Transaction.objects.create(
            user=user,
            type=Transaction.TYPE_REFUND,
            amount=withdrawal.amount,
            description=f"Withdrawal refund: #{withdrawal.id}",
        )

        withdrawal.status = Withdrawal.STATUS_REJECTED
        withdrawal.reviewed_by = request.user
        withdrawal.reviewed_at = timezone.now()
        withdrawal.admin_note = admin_note
        withdrawal.save(update_fields=["status", "reviewed_by", "reviewed_at", "admin_note"])

        return Response(WithdrawalSerializer(withdrawal).data)


class AdminBulkApproveWithdrawalView(APIView):
    """POST /api/wallet/admin/withdrawals/bulk-approve/ — Approve multiple pending withdrawals."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        ids = request.data.get("ids", [])
        if not ids or not isinstance(ids, list):
            return Response(
                {"detail": "Provide a list of withdrawal IDs in 'ids'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        updated = Withdrawal.objects.filter(
            id__in=ids, status=Withdrawal.STATUS_PENDING
        )
        count = updated.update(
            status=Withdrawal.STATUS_APPROVED,
            reviewed_by=request.user,
            reviewed_at=now,
        )
        return Response({"detail": f"{count} withdrawal(s) approved.", "count": count})


class AdminSiteSettingsView(APIView):
    """GET/POST /api/wallet/admin/settings/ — Read or bulk-update platform settings (admin only)."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        # Return all managed settings with current values
        data = []
        for s in MANAGED_SETTINGS:
            data.append({
                "key":   s["key"],
                "label": s["label"],
                "value": get_setting(s["key"], s["default"]),
            })
        return Response(data)

    def post(self, request):
        updates = request.data  # expects {key: value, ...}
        if not isinstance(updates, dict):
            return Response({"detail": "Expected a JSON object of {key: value} pairs."}, status=400)

        valid_keys = {s["key"] for s in MANAGED_SETTINGS}
        saved = []
        for key, value in updates.items():
            if key not in valid_keys:
                continue
            label = next((s["label"] for s in MANAGED_SETTINGS if s["key"] == key), key)
            SiteSetting.objects.update_or_create(
                key=key,
                defaults={"value": str(value), "label": label},
            )
            saved.append(key)
        return Response({"detail": f"{len(saved)} setting(s) saved.", "saved": saved})


class AdminVIPPlanViewSet(generics.ListCreateAPIView):
    """GET/POST /api/wallet/admin/vip-plans/ — Manage VIP plans (admin only)."""

    queryset = VIPPlan.objects.all()
    serializer_class = VIPPlanSerializer
    permission_classes = [IsAuthenticated, IsAdmin]


class AdminVIPPlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/wallet/admin/vip-plans/<id>/ — VIP plan detail (admin only)."""

    queryset = VIPPlan.objects.all()
    serializer_class = VIPPlanSerializer
    permission_classes = [IsAuthenticated, IsAdmin]


# ─── Manual Payout management ────────────────────────────────────────────────


class AdminManualPayoutListView(generics.ListCreateAPIView):
    """
    GET  /api/wallet/admin/manual-payouts/  — List all manual payout entries.
    POST /api/wallet/admin/manual-payouts/  — Create a new manual payout entry.
    """

    queryset = ManualPayout.objects.all()
    serializer_class = ManualPayoutSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = None


class AdminManualPayoutDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/wallet/admin/manual-payouts/<id>/  — Retrieve entry.
    PATCH  /api/wallet/admin/manual-payouts/<id>/  — Update entry.
    DELETE /api/wallet/admin/manual-payouts/<id>/  — Delete entry.
    """

    queryset = ManualPayout.objects.all()
    serializer_class = ManualPayoutSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    http_method_names = ["get", "patch", "delete", "head", "options"]


class AdminManualPayoutToggleView(APIView):
    """POST /api/wallet/admin/manual-payouts/<id>/toggle/ — Toggle is_active."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            entry = ManualPayout.objects.get(pk=pk)
        except ManualPayout.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        entry.is_active = not entry.is_active
        entry.save(update_fields=["is_active"])
        return Response({"id": str(entry.id), "is_active": entry.is_active})


# ─── Member Stories ──────────────────────────────────────────────────────────


class PublicMemberStoriesView(generics.ListAPIView):
    """GET /api/wallet/public/member-stories/ — Active stories for landing page (no auth)."""

    serializer_class = MemberStorySerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        return MemberStory.objects.filter(is_active=True).order_by("sort_order", "created_at")


class AdminMemberStoryListView(generics.ListCreateAPIView):
    """GET/POST /api/wallet/admin/member-stories/ — List & create (admin only)."""

    queryset = MemberStory.objects.all().order_by("sort_order", "created_at")
    serializer_class = MemberStorySerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = None


class AdminMemberStoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/wallet/admin/member-stories/<id>/ — Detail (admin only)."""

    queryset = MemberStory.objects.all()
    serializer_class = MemberStorySerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    http_method_names = ["get", "patch", "delete", "head", "options"]


class AdminMemberStoryToggleView(APIView):
    """POST /api/wallet/admin/member-stories/<id>/toggle/ — Toggle is_active."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            story = MemberStory.objects.get(pk=pk)
        except MemberStory.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        story.is_active = not story.is_active
        story.save(update_fields=["is_active"])
        return Response({"id": str(story.id), "is_active": story.is_active})
