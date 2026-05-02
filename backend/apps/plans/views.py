"""
Plans views — admin CRUD + public list + payment wallets + plan purchases.
"""
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.rbac.permissions import IsAdmin
from .models import Plan, PaymentWallet, PlanPurchase
from .serializers import (
    PlanSerializer,
    PaymentWalletSerializer,
    PlanPurchaseSerializer,
    SubmitPlanPurchaseSerializer,
)


# ─── Public endpoints ─────────────────────────────────────────────────────────


class PublicPlanListView(generics.ListAPIView):
    """GET /api/plans/public/ — Active plans (no auth)."""

    serializer_class = PlanSerializer
    authentication_classes = []
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        return Plan.objects.filter(is_active=True).order_by("sort_order", "name")


class PublicPaymentWalletListView(generics.ListAPIView):
    """GET /api/plans/public/wallets/ — Active payment wallets (no auth)."""

    serializer_class = PaymentWalletSerializer
    authentication_classes = []
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        return PaymentWallet.objects.filter(is_active=True).order_by("sort_order")


# ─── Plan admin endpoints ─────────────────────────────────────────────────────


class AdminPlanListView(generics.ListCreateAPIView):
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = None


class AdminPlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    http_method_names = ["get", "patch", "delete", "head", "options"]


class AdminPlanToggleView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            plan = Plan.objects.get(pk=pk)
        except Plan.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        plan.is_active = not plan.is_active
        plan.save(update_fields=["is_active"])
        return Response({"id": str(plan.id), "is_active": plan.is_active})


class AdminPlanToggleFeaturedView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            plan = Plan.objects.get(pk=pk)
        except Plan.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        plan.is_featured = not plan.is_featured
        plan.save(update_fields=["is_featured"])
        return Response({"id": str(plan.id), "is_featured": plan.is_featured})


# ─── Payment wallet admin endpoints ──────────────────────────────────────────


class AdminPaymentWalletListView(generics.ListCreateAPIView):
    """GET/POST /api/plans/admin/wallets/"""

    queryset = PaymentWallet.objects.all()
    serializer_class = PaymentWalletSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = None


class AdminPaymentWalletDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/plans/admin/wallets/<id>/"""

    queryset = PaymentWallet.objects.all()
    serializer_class = PaymentWalletSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    http_method_names = ["get", "patch", "delete", "head", "options"]


class AdminPaymentWalletToggleView(APIView):
    """POST /api/plans/admin/wallets/<id>/toggle/"""

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            wallet = PaymentWallet.objects.get(pk=pk)
        except PaymentWallet.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        wallet.is_active = not wallet.is_active
        wallet.save(update_fields=["is_active"])
        return Response({"id": str(wallet.id), "is_active": wallet.is_active})


# ─── Plan purchase endpoints ──────────────────────────────────────────────────


class SubmitPlanPurchaseView(APIView):
    """POST /api/plans/purchases/ — User submits payment proof."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SubmitPlanPurchaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        try:
            plan = Plan.objects.get(pk=d["plan_id"], is_active=True)
        except Plan.DoesNotExist:
            return Response({"detail": "Plan not found or inactive."}, status=status.HTTP_404_NOT_FOUND)

        try:
            wallet = PaymentWallet.objects.get(pk=d["payment_wallet"], is_active=True)
        except PaymentWallet.DoesNotExist:
            return Response({"detail": "Payment wallet not found."}, status=status.HTTP_404_NOT_FOUND)

        # Prevent duplicate pending submission for same plan
        if PlanPurchase.objects.filter(user=request.user, plan=plan, status=PlanPurchase.STATUS_PENDING).exists():
            return Response(
                {"detail": "You already have a pending payment for this plan."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        purchase = PlanPurchase.objects.create(
            user=request.user,
            plan=plan,
            plan_name=plan.name,
            amount_paid=plan.price,
            payment_wallet=wallet,
            tx_hash=d["tx_hash"],
            notes=d.get("notes", ""),
        )
        return Response(PlanPurchaseSerializer(purchase).data, status=status.HTTP_201_CREATED)


class MyPlanPurchasesView(generics.ListAPIView):
    """GET /api/plans/purchases/my/ — Authenticated user's own purchases."""

    serializer_class = PlanPurchaseSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return PlanPurchase.objects.filter(user=self.request.user).select_related("plan", "payment_wallet", "reviewed_by")


class AdminPlanPurchaseListView(generics.ListAPIView):
    """GET /api/plans/admin/purchases/ — All purchases (admin only)."""

    queryset = PlanPurchase.objects.all().select_related("user", "plan", "payment_wallet", "reviewed_by")
    serializer_class = PlanPurchaseSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = None


class AdminConfirmPurchaseView(APIView):
    """POST /api/plans/admin/purchases/<id>/confirm/ — Mark purchase as confirmed."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            purchase = PlanPurchase.objects.select_related("user", "plan").get(pk=pk)
        except PlanPurchase.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if purchase.status != PlanPurchase.STATUS_PENDING:
            return Response({"detail": f"Purchase is already '{purchase.status}'."}, status=status.HTTP_400_BAD_REQUEST)

        purchase.status = PlanPurchase.STATUS_CONFIRMED
        purchase.admin_note = request.data.get("admin_note", "")
        purchase.reviewed_by = request.user
        purchase.reviewed_at = timezone.now()
        purchase.save(update_fields=["status", "admin_note", "reviewed_by", "reviewed_at"])
        return Response(PlanPurchaseSerializer(purchase).data)


class AdminRejectPurchaseView(APIView):
    """POST /api/plans/admin/purchases/<id>/reject/ — Reject a purchase."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            purchase = PlanPurchase.objects.select_related("user", "plan").get(pk=pk)
        except PlanPurchase.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if purchase.status != PlanPurchase.STATUS_PENDING:
            return Response({"detail": f"Purchase is already '{purchase.status}'."}, status=status.HTTP_400_BAD_REQUEST)

        purchase.status = PlanPurchase.STATUS_REJECTED
        purchase.admin_note = request.data.get("admin_note", "")
        purchase.reviewed_by = request.user
        purchase.reviewed_at = timezone.now()
        purchase.save(update_fields=["status", "admin_note", "reviewed_by", "reviewed_at"])
        return Response(PlanPurchaseSerializer(purchase).data)
