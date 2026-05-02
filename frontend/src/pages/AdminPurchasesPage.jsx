/**
 * AdminPurchasesPage — review and verify customer plan payment submissions.
 */
import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, XCircle, Eye, Clock, FileText,
  DollarSign, Hash, User, Wallet, Copy, AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import purchasesApi from "../api/purchasesApi";
import DataTable from "../components/ui/DataTable";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_BADGE = {
  pending:   { color: "warning", label: "Pending"   },
  confirmed: { color: "success", label: "Confirmed" },
  rejected:  { color: "error",   label: "Rejected"  },
};

const FILTERS = ["all", "pending", "confirmed", "rejected"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmt(val) {
  return Number(val ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => toast.success("Copied"));
}

// ─── Info row (used inside review modal) ─────────────────────────────────────

function InfoRow({ icon: Icon, label, value, sub, onCopy }) {
  return (
    <div className="p-3 rounded-xl bg-(--bg-input) border theme-border">
      <p className="text-xs theme-text-muted mb-1.5 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </p>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium theme-text break-words">{value}</p>
          {sub && (
            <p className="text-xs font-mono theme-text-muted mt-0.5 break-all">{sub}</p>
          )}
        </div>
        {onCopy && (
          <button
            onClick={onCopy}
            className="shrink-0 p-1 rounded hover:bg-(--bg-card) transition-colors cursor-pointer mt-0.5"
          >
            <Copy className="w-3.5 h-3.5 theme-text-muted" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Stats card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, gradientClass, delay }) {
  return (
    <div
      className="card rounded-2xl p-5 flex items-center gap-4 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-11 h-11 rounded-xl bg-linear-to-br ${gradientClass} flex items-center justify-center shadow-lg shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs theme-text-muted uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold theme-text">{value}</p>
      </div>
    </div>
  );
}

// ─── Review modal ─────────────────────────────────────────────────────────────

function ReviewModal({ purchase, onClose, onRefresh }) {
  const [adminNote, setAdminNote] = useState("");
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    if (purchase) setAdminNote(purchase.admin_note ?? "");
  }, [purchase]);

  if (!purchase) return null;

  const isPending = purchase.status === "pending";
  const badge     = STATUS_BADGE[purchase.status] ?? { color: "default", label: purchase.status };

  const act = async (action) => {
    setSaving(true);
    try {
      if (action === "confirm") {
        await purchasesApi.confirm(purchase.id, adminNote);
        toast.success("Payment confirmed — plan activated for user");
      } else {
        await purchasesApi.reject(purchase.id, adminNote);
        toast.success("Payment rejected");
      }
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail ?? "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={!!purchase}
      onClose={onClose}
      title="Payment Submission Review"
      size="lg"
      footer={
        isPending ? (
          <>
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={XCircle}
              loading={saving}
              onClick={() => act("reject")}
            >
              Reject
            </Button>
            <Button
              icon={CheckCircle2}
              loading={saving}
              onClick={() => act("confirm")}
            >
              Confirm Payment
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>Close</Button>
        )
      }
    >
      <div className="space-y-4">

        {/* Status banner */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-(--bg-input) border theme-border">
          <span className="text-sm theme-text-muted">Submission status</span>
          <Badge color={badge.color} dot size="sm">{badge.label}</Badge>
        </div>

        {/* Core info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow icon={User}       label="User"        value={purchase.user_email} />
          <InfoRow icon={FileText}   label="Plan"        value={purchase.plan_name} />
          <InfoRow
            icon={DollarSign}
            label="Amount Paid"
            value={`$${fmt(purchase.amount_paid)} USDT`}
          />
          <InfoRow icon={Clock} label="Submitted" value={fmtDate(purchase.created_at)} />

          {purchase.wallet_network && (
            <InfoRow
              icon={Wallet}
              label="Payment Network"
              value={purchase.wallet_network}
              sub={purchase.wallet_address ?? ""}
              onCopy={purchase.wallet_address ? () => copyText(purchase.wallet_address) : undefined}
            />
          )}

          {purchase.reviewed_at && (
            <InfoRow
              icon={ShieldCheck}
              label="Reviewed"
              value={fmtDate(purchase.reviewed_at)}
              sub={purchase.reviewed_by_email ?? ""}
            />
          )}
        </div>

        {/* TX Hash */}
        <div>
          <p className="text-xs theme-text-muted mb-1.5 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5" />
            Transaction Hash
          </p>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-(--bg-input) border theme-border">
            <span className="font-mono text-sm theme-text flex-1 break-all">
              {purchase.tx_hash}
            </span>
            <button
              onClick={() => copyText(purchase.tx_hash)}
              className="shrink-0 p-1.5 rounded-lg hover:bg-(--bg-card) transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4 theme-text-muted" />
            </button>
          </div>
        </div>

        {/* User notes */}
        {purchase.notes && (
          <div>
            <p className="text-xs theme-text-muted mb-1.5">Note from User</p>
            <p className="text-sm theme-text p-3 rounded-xl bg-(--bg-input) border theme-border leading-relaxed">
              {purchase.notes}
            </p>
          </div>
        )}

        {/* Admin note — editable if pending, read-only otherwise */}
        {isPending ? (
          <div>
            <p className="text-xs theme-text-muted mb-1.5">
              Admin Note <span className="opacity-60">(optional — shown to user)</span>
            </p>
            <textarea
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Reason for confirming or rejecting…"
              className="w-full px-3 py-2.5 rounded-xl bg-(--bg-input) border theme-border theme-text text-sm resize-none outline-none focus:border-primary-500/60 transition-colors placeholder:theme-text-muted"
            />
          </div>
        ) : purchase.admin_note ? (
          <div>
            <p className="text-xs theme-text-muted mb-1.5">Admin Note</p>
            <p className="text-sm theme-text p-3 rounded-xl bg-(--bg-input) border theme-border leading-relaxed">
              {purchase.admin_note}
            </p>
          </div>
        ) : null}

        {/* Verify warning */}
        {isPending && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-500/25"
               style={{ background: "rgba(245,158,11,0.07)" }}>
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300 leading-relaxed">
              Verify the transaction hash on the blockchain explorer before confirming.
              Confirming will mark the plan as active for this user.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("all");
  const [selected,  setSelected]  = useState(null);

  const fetchPurchases = useCallback(async () => {
    try {
      const res = await purchasesApi.list();
      // Sort: pending first, then by date desc
      const data = (res.data.results ?? res.data).sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (b.status === "pending" && a.status !== "pending") return  1;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setPurchases(data);
    } catch {
      toast.error("Failed to load payment submissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  const filtered = filter === "all"
    ? purchases
    : purchases.filter((p) => p.status === filter);

  const counts = {
    all:       purchases.length,
    pending:   purchases.filter((p) => p.status === "pending").length,
    confirmed: purchases.filter((p) => p.status === "confirmed").length,
    rejected:  purchases.filter((p) => p.status === "rejected").length,
  };

  // ─── Table columns ───

  const columns = [
    {
      key: "user",
      header: "User",
      accessor: "user_email",
      searchable: true,
      sortable: true,
      render: (r) => (
        <p className="text-sm font-medium theme-text">{r.user_email}</p>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      accessor: "plan_name",
      searchable: true,
      sortable: true,
      render: (r) => (
        <div>
          <p className="text-sm font-medium theme-text">{r.plan_name}</p>
          <p className="text-xs theme-text-muted">${fmt(r.amount_paid)} USDT</p>
        </div>
      ),
    },
    {
      key: "tx",
      header: "TX Hash",
      accessor: "tx_hash",
      searchable: true,
      render: (r) => (
        <span
          className="text-xs font-mono theme-text-secondary truncate block max-w-[160px]"
          title={r.tx_hash}
        >
          {r.tx_hash}
        </span>
      ),
    },
    {
      key: "network",
      header: "Network",
      accessor: "wallet_network",
      render: (r) => (
        <span className="text-xs theme-text-secondary">{r.wallet_network ?? "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: "status",
      sortable: true,
      render: (r) => {
        const b = STATUS_BADGE[r.status] ?? { color: "default", label: r.status };
        return <Badge color={b.color} dot size="sm">{b.label}</Badge>;
      },
    },
    {
      key: "submitted",
      header: "Submitted",
      accessor: "created_at",
      sortable: true,
      render: (r) => (
        <span className="text-xs theme-text-muted">{fmtDate(r.created_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "100px",
      render: (r) => (
        <Button
          variant="ghost"
          size="xs"
          icon={Eye}
          onClick={(e) => { e.stopPropagation(); setSelected(r); }}
        >
          Review
        </Button>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Payment Submissions"
        subtitle={`${counts.pending} pending review · ${counts.all} total submissions`}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total"     value={counts.all}       icon={FileText}
          gradientClass="from-primary-500 to-primary-700" delay={0}
        />
        <StatCard
          label="Pending"   value={counts.pending}   icon={Clock}
          gradientClass="from-amber-500 to-amber-700"   delay={60}
        />
        <StatCard
          label="Confirmed" value={counts.confirmed} icon={CheckCircle2}
          gradientClass="from-emerald-500 to-emerald-700" delay={120}
        />
        <StatCard
          label="Rejected"  value={counts.rejected}  icon={XCircle}
          gradientClass="from-red-500 to-red-700"       delay={180}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl bg-(--bg-input) w-fit">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all cursor-pointer ${
              filter === f
                ? "bg-(--bg-card) theme-text shadow-sm"
                : "theme-text-muted hover:theme-text"
            }`}
          >
            {f}
            {f !== "all" && counts[f] > 0 && (
              <span className="ml-1.5 text-xs opacity-60">({counts[f]})</span>
            )}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        searchPlaceholder="Search by user, plan, or TX hash…"
        pageSize={20}
        emptyTitle="No payment submissions"
        emptyDescription={
          filter === "pending"
            ? "No pending payments to review — all caught up!"
            : "No submissions match this filter."
        }
        onRowClick={(r) => setSelected(r)}
      />

      <ReviewModal
        purchase={selected}
        onClose={() => setSelected(null)}
        onRefresh={fetchPurchases}
      />
    </div>
  );
}
