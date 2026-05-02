/**
 * AdminWithdrawalsPage
 *  Tab 1 — Withdrawal Requests  : approve / reject / bulk-approve
 *  Tab 2 — Live Payouts Display  : manage manual payout entries shown on landing page ticker
 */
import { useState, useEffect, useMemo } from "react";
import {
  RefreshCw, Check, X, Search, Clock,
  CheckCircle, XCircle, Banknote, Copy,
  Plus, Eye, EyeOff, Trash2, Edit2, Globe,
  ToggleLeft, ToggleRight, Info,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axiosInstance";
import Badge from "../components/ui/Badge";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function fmt(val) {
  return Number(val ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDateTimeLocal(iso) {
  // Convert ISO string to datetime-local input format (YYYY-MM-DDTHH:MM)
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 16);
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={copy} title="Copy"
      className="p-1 rounded hover:bg-(--bg-input) transition-colors cursor-pointer">
      {copied
        ? <Check className="w-3.5 h-3.5 text-emerald-400" />
        : <Copy  className="w-3.5 h-3.5 theme-text-muted" />}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 1 — WITHDRAWAL REQUESTS
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_COLOR = { pending: "warning", approved: "success", rejected: "danger" };
const STATUS_ICON  = {
  pending:  <Clock       className="w-3.5 h-3.5 text-amber-400" />,
  approved: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
  rejected: <XCircle     className="w-3.5 h-3.5 text-red-400" />,
};
const WTABS = ["all", "pending", "approved", "rejected"];

function ApproveModal({ withdrawal, onClose, onDone }) {
  const [loading, setLoading] = useState(false);
  const confirm = async () => {
    setLoading(true);
    try {
      await axiosInstance.post(`/wallet/admin/withdrawals/${withdrawal.id}/approve/`);
      toast.success("Withdrawal approved.");
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to approve.");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-fade-in-up space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
          <Check className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-semibold theme-text">Approve Withdrawal?</h3>
          <p className="text-sm theme-text-secondary mt-1">
            Approve <span className="font-semibold theme-text">${fmt(withdrawal.amount)}</span>{" "}
            for <span className="font-semibold theme-text">{withdrawal.user_email}</span>?
          </p>
        </div>
        <div className="card rounded-xl p-3 text-xs font-mono theme-text-secondary break-all">
          {withdrawal.wallet_address || "—"}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium theme-text-secondary bg-(--bg-input) border theme-border hover:theme-text transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={confirm} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors cursor-pointer">
            {loading ? "Approving…" : "Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectModal({ withdrawal, onClose, onDone }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const confirm = async () => {
    setLoading(true);
    try {
      await axiosInstance.post(`/wallet/admin/withdrawals/${withdrawal.id}/reject/`, { admin_note: note.trim() });
      toast.success("Withdrawal rejected and balance refunded.");
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to reject.");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-fade-in-up space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
          <X className="w-6 h-6 text-red-400" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-semibold theme-text">Reject Withdrawal?</h3>
          <p className="text-sm theme-text-secondary mt-1">The amount will be refunded to the user's wallet.</p>
        </div>
        <div>
          <label className="block text-xs font-medium theme-text-secondary mb-1">Reason / Note (optional)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
            placeholder="e.g. Invalid wallet address"
            className="w-full px-3 py-2 rounded-xl text-sm theme-text bg-(--bg-input) border theme-border focus:outline-none focus:border-primary-500 resize-none transition-colors" />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium theme-text-secondary bg-(--bg-input) border theme-border hover:theme-text transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={confirm} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-colors cursor-pointer">
            {loading ? "Rejecting…" : "Reject & Refund"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BulkApproveModal({ ids, onClose, onDone }) {
  const [loading, setLoading] = useState(false);
  const confirm = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.post("/wallet/admin/withdrawals/bulk-approve/", { ids });
      toast.success(res.data.detail);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Bulk approve failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-fade-in-up space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
          <CheckCircle className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-semibold theme-text">Bulk Approve</h3>
          <p className="text-sm theme-text-secondary mt-1">
            Approve <span className="font-semibold theme-text">{ids.length}</span> selected withdrawal{ids.length !== 1 ? "s" : ""}?
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium theme-text-secondary bg-(--bg-input) border theme-border hover:theme-text transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={confirm} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors cursor-pointer">
            {loading ? "Approving…" : "Approve All"}
          </button>
        </div>
      </div>
    </div>
  );
}

function WithdrawalsTab() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [activeTab,   setActiveTab]   = useState("all");
  const [selected,    setSelected]    = useState(new Set());
  const [modal,       setModal]       = useState(null);

  const load = async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const res = await axiosInstance.get("/wallet/admin/withdrawals/");
      setWithdrawals(res.data.results ?? res.data);
    } catch {
      toast.error("Failed to load withdrawals.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => ({
    all:      withdrawals.length,
    pending:  withdrawals.filter(w => w.status === "pending").length,
    approved: withdrawals.filter(w => w.status === "approved").length,
    rejected: withdrawals.filter(w => w.status === "rejected").length,
  }), [withdrawals]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return withdrawals.filter(w => {
      const matchTab    = activeTab === "all" || w.status === activeTab;
      const matchSearch = !q || w.user_email?.toLowerCase().includes(q) || w.wallet_address?.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [withdrawals, activeTab, search]);

  const visiblePendingIds = filtered.filter(w => w.status === "pending").map(w => w.id);
  const allPendingSelected = visiblePendingIds.length > 0 && visiblePendingIds.every(id => selected.has(id));

  const toggleAll = () => {
    if (allPendingSelected) {
      setSelected(prev => { const n = new Set(prev); visiblePendingIds.forEach(id => n.delete(id)); return n; });
    } else {
      setSelected(prev => new Set([...prev, ...visiblePendingIds]));
    }
  };
  const toggleRow = id => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const pendingAmount = withdrawals.filter(w => w.status === "pending").reduce((s, w) => s + Number(w.amount), 0);
  const closeModal = () => setModal(null);
  const afterAction = () => { closeModal(); load(); };

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Pending Requests", value: loading ? "—" : counts.pending,            icon: Clock,       color: "text-amber-400",   bg: "bg-amber-500/10"   },
          { label: "Pending Amount",   value: loading ? "—" : `$${fmt(pendingAmount)}`,  icon: Banknote,    color: "text-red-400",     bg: "bg-red-500/10"     },
          { label: "Total Approved",   value: loading ? "—" : counts.approved,           icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        ].map(s => (
          <div key={s.label} className="card rounded-2xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xs theme-text-muted">{s.label}</p>
              <p className="text-lg font-bold theme-text">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs + search */}
      <div className="card rounded-2xl overflow-hidden">
        <div className="flex items-center border-b theme-border">
          <div className="flex overflow-x-auto flex-1">
            {WTABS.map(tab => (
              <button key={tab}
                onClick={() => { setActiveTab(tab); setSelected(new Set()); }}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer border-b-2 capitalize ${
                  activeTab === tab
                    ? "border-primary-500 text-primary-400"
                    : "border-transparent theme-text-secondary hover:theme-text"
                }`}>
                {tab}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab ? "bg-primary-600/20 text-primary-300" : "bg-(--bg-input) theme-text-muted"
                }`}>
                  {counts[tab]}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={load}
            disabled={loading}
            title="Refresh"
            className="flex items-center gap-1.5 px-4 py-3.5 text-sm theme-text-muted hover:theme-text transition-colors cursor-pointer disabled:opacity-50 border-b-2 border-transparent whitespace-nowrap shrink-0">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 theme-text-muted pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by email or wallet address…"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm theme-text bg-(--bg-input) border theme-border focus:outline-none focus:border-primary-500 transition-colors" />
          </div>
          {selected.size > 0 && (
            <button onClick={() => setModal({ type: "bulk", ids: [...selected] })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors cursor-pointer whitespace-nowrap">
              <Check className="w-4 h-4" />
              Approve Selected ({selected.size})
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b theme-border">
                <th className="pl-5 pr-2 py-3.5 w-10">
                  {visiblePendingIds.length > 0 && (
                    <input type="checkbox" checked={allPendingSelected} onChange={toggleAll}
                      className="w-4 h-4 rounded accent-primary-500 cursor-pointer" />
                  )}
                </th>
                {["User", "Amount", "Wallet Address", "Requested", "Status", "Reviewed By", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold theme-text-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border-primary)">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {Array(8).fill(null).map((__, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 rounded bg-(--bg-input) animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm theme-text-muted">No withdrawals found.</td>
                </tr>
              ) : (
                filtered.map(w => (
                  <tr key={w.id}
                    className={`transition-colors ${selected.has(w.id) ? "bg-primary-600/5" : "hover:bg-(--bg-card-hover)"}`}>
                    <td className="pl-5 pr-2 py-4">
                      {w.status === "pending" && (
                        <input type="checkbox" checked={selected.has(w.id)} onChange={() => toggleRow(w.id)}
                          className="w-4 h-4 rounded accent-primary-500 cursor-pointer" />
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium theme-text">{w.user_email || "—"}</p>
                    </td>
                    <td className="px-4 py-4 font-semibold theme-text whitespace-nowrap">${fmt(w.amount)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono theme-text-secondary truncate max-w-37.5">{w.wallet_address || "—"}</span>
                        {w.wallet_address && <CopyBtn text={w.wallet_address} />}
                      </div>
                      {w.admin_note && (
                        <p className="text-xs text-red-400 mt-0.5 truncate max-w-50" title={w.admin_note}>
                          Note: {w.admin_note}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs theme-text-muted whitespace-nowrap">{fmtDateTime(w.created_at)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        {STATUS_ICON[w.status]}
                        <Badge color={STATUS_COLOR[w.status] ?? "neutral"} size="sm" className="capitalize">{w.status}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs theme-text-muted whitespace-nowrap">
                      {w.reviewed_by_email
                        ? <span title={fmtDateTime(w.reviewed_at)}>{w.reviewed_by_email}</span>
                        : "—"}
                    </td>
                    <td className="px-4 py-4">
                      {w.status === "pending" ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => setModal({ type: "approve", withdrawal: w })}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors cursor-pointer">
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button onClick={() => setModal({ type: "reject", withdrawal: w })}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-red-600 hover:bg-red-500 transition-colors cursor-pointer">
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs theme-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t theme-border flex items-center justify-between">
            <p className="text-xs theme-text-muted">
              {filtered.length} shown{filtered.length !== withdrawals.length && ` of ${withdrawals.length}`}
            </p>
            {selected.size > 0 && <p className="text-xs text-primary-400">{selected.size} selected</p>}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === "approve" && <ApproveModal withdrawal={modal.withdrawal} onClose={closeModal} onDone={afterAction} />}
      {modal?.type === "reject"  && <RejectModal  withdrawal={modal.withdrawal} onClose={closeModal} onDone={afterAction} />}
      {modal?.type === "bulk"    && <BulkApproveModal ids={modal.ids}           onClose={closeModal} onDone={afterAction} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 2 — LIVE PAYOUTS DISPLAY
// ═══════════════════════════════════════════════════════════════════════════════

const EMPTY_FORM = { username: "", amount: "", payout_date: "", note: "", is_active: true };

function PayoutFormModal({ entry, onClose, onDone }) {
  const isEdit = !!entry;
  const [form, setForm] = useState(
    isEdit
      ? { username: entry.username, amount: entry.amount, payout_date: fmtDateTimeLocal(entry.payout_date), note: entry.note || "", is_active: entry.is_active }
      : { ...EMPTY_FORM, payout_date: fmtDateTimeLocal(new Date().toISOString()) }
  );
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "Required";
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = "Must be a positive number";
    if (!form.payout_date) e.payout_date = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    const payload = {
      username:    form.username.trim(),
      amount:      Number(form.amount),
      payout_date: new Date(form.payout_date).toISOString(),
      note:        form.note.trim(),
      is_active:   form.is_active,
    };
    try {
      if (isEdit) {
        await axiosInstance.patch(`/wallet/admin/manual-payouts/${entry.id}/`, payload);
        toast.success("Entry updated.");
      } else {
        await axiosInstance.post("/wallet/admin/manual-payouts/", payload);
        toast.success("Payout entry added.");
      }
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Save failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up space-y-5">
        <div>
          <h3 className="text-base font-semibold theme-text">
            {isEdit ? "Edit Payout Entry" : "Add Payout Entry"}
          </h3>
          <p className="text-xs theme-text-muted mt-1">
            This entry will appear in the landing page live ticker.
          </p>
        </div>

        {/* Username */}
        <div>
          <label className="block text-xs font-medium theme-text-secondary mb-1.5">
            Display Username <span className="text-red-400">*</span>
          </label>
          <input value={form.username} onChange={e => set("username", e.target.value)}
            placeholder="e.g. Sarah123"
            className="w-full px-3 py-2.5 rounded-xl text-sm theme-text bg-(--bg-input) border theme-border focus:outline-none focus:border-primary-500 transition-colors" />
          <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
            <Info className="w-3 h-3" /> This name will be automatically masked (e.g. "Sa***3") on the public page.
          </p>
          {errors.username && <p className="text-xs text-red-400 mt-1">{errors.username}</p>}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-medium theme-text-secondary mb-1.5">
            Amount (USDT) <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm theme-text-muted">$</span>
            <input type="number" min="0" step="0.01" value={form.amount} onChange={e => set("amount", e.target.value)}
              placeholder="0.00"
              className="w-full pl-7 pr-3 py-2.5 rounded-xl text-sm theme-text bg-(--bg-input) border theme-border focus:outline-none focus:border-primary-500 transition-colors" />
          </div>
          {errors.amount && <p className="text-xs text-red-400 mt-1">{errors.amount}</p>}
        </div>

        {/* Payout Date */}
        <div>
          <label className="block text-xs font-medium theme-text-secondary mb-1.5">
            Payout Date & Time <span className="text-red-400">*</span>
          </label>
          <input type="datetime-local" value={form.payout_date} onChange={e => set("payout_date", e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm theme-text bg-(--bg-input) border theme-border focus:outline-none focus:border-primary-500 transition-colors" />
          {errors.payout_date && <p className="text-xs text-red-400 mt-1">{errors.payout_date}</p>}
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-(--bg-input) border theme-border">
          <div>
            <p className="text-sm font-medium theme-text">Show on landing page</p>
            <p className="text-xs theme-text-muted mt-0.5">Inactive entries are saved but not displayed publicly.</p>
          </div>
          <button onClick={() => set("is_active", !form.is_active)}
            className={`w-12 h-6 rounded-full transition-colors cursor-pointer relative ${form.is_active ? "bg-emerald-500" : "theme-bg-card"} border theme-border`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-6" : "translate-x-0.5"}`} />
          </button>
        </div>

        {/* Internal note */}
        <div>
          <label className="block text-xs font-medium theme-text-secondary mb-1.5">Internal Note (optional)</label>
          <input value={form.note} onChange={e => set("note", e.target.value)}
            placeholder="e.g. Demo seed data"
            className="w-full px-3 py-2.5 rounded-xl text-sm theme-text bg-(--bg-input) border theme-border focus:outline-none focus:border-primary-500 transition-colors" />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium theme-text-secondary bg-(--bg-input) border theme-border hover:theme-text transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={submit} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 disabled:opacity-50 transition-colors cursor-pointer">
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ entry, onClose, onDone }) {
  const [loading, setLoading] = useState(false);
  const confirm = async () => {
    setLoading(true);
    try {
      await axiosInstance.delete(`/wallet/admin/manual-payouts/${entry.id}/`);
      toast.success("Entry deleted.");
      onDone();
    } catch {
      toast.error("Failed to delete.");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-fade-in-up space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
          <Trash2 className="w-6 h-6 text-red-400" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-semibold theme-text">Delete Entry?</h3>
          <p className="text-sm theme-text-secondary mt-1">
            Remove <span className="font-semibold theme-text">{entry.username}</span> · ${fmt(entry.amount)} from the live ticker?
            This cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium theme-text-secondary bg-(--bg-input) border theme-border hover:theme-text transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={confirm} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-colors cursor-pointer">
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LivePayoutsTab() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [modal,   setModal]   = useState(null); // { type: "form"|"delete", entry? }

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/wallet/admin/manual-payouts/");
      setEntries(res.data.results ?? res.data);
    } catch {
      toast.error("Failed to load payout entries.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? entries : entries.filter(e => e.username.toLowerCase().includes(q) || e.note?.toLowerCase().includes(q));
  }, [entries, search]);

  const activeCount = entries.filter(e => e.is_active).length;

  const toggle = async (entry) => {
    try {
      const res = await axiosInstance.post(`/wallet/admin/manual-payouts/${entry.id}/toggle/`);
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, is_active: res.data.is_active } : e));
      toast.success(res.data.is_active ? "Entry is now visible on landing page." : "Entry hidden from landing page.");
    } catch {
      toast.error("Failed to toggle.");
    }
  };

  const closeModal = () => setModal(null);
  const afterAction = () => { closeModal(); load(); };

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="rounded-2xl p-4 flex items-start gap-3 bg-primary-600/8 border border-primary-500/20">
        <Globe className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-primary-300">Live Payout Display</p>
          <p className="text-xs theme-text-secondary mt-0.5 leading-relaxed">
            These entries are merged with real approved withdrawals and shown in the live ticker on the landing page.
            Use them to seed social proof before real payouts accumulate. Usernames are automatically masked.
            Currently <span className="font-semibold text-primary-300">{activeCount} active</span> {activeCount !== entries.length && `of ${entries.length} total`}.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 theme-text-muted pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by username or note…"
            className="w-full pl-9 pr-3 py-2 rounded-xl text-sm theme-text bg-(--bg-input) border theme-border focus:outline-none focus:border-primary-500 transition-colors" />
        </div>
        <button onClick={() => setModal({ type: "form", entry: null })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 transition-colors cursor-pointer whitespace-nowrap">
          <Plus className="w-4 h-4" />
          Add Entry
        </button>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm theme-text-secondary hover:theme-text hover:bg-(--bg-input) border theme-border transition-all disabled:opacity-50 cursor-pointer">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b theme-border">
                {["Display Name", "Amount", "Payout Date", "Status", "Internal Note", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold theme-text-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border-primary)">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {Array(6).fill(null).map((__, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 rounded bg-(--bg-input) animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Globe className="w-10 h-10 theme-text-muted mx-auto mb-3 opacity-30" />
                    <p className="text-sm theme-text-muted">No payout entries yet.</p>
                    <p className="text-xs theme-text-muted mt-1">Click "Add Entry" to create your first landing page payout proof.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(entry => (
                  <tr key={entry.id} className="hover:bg-(--bg-card-hover) transition-colors">
                    {/* Display name */}
                    <td className="px-5 py-4">
                      <p className="font-semibold theme-text">{entry.username}</p>
                      <p className="text-xs theme-text-muted">Shown as: {
                        entry.username.length <= 3
                          ? entry.username[0] + "***"
                          : entry.username.slice(0, 2) + "***" + entry.username.slice(-1)
                      }</p>
                    </td>
                    {/* Amount */}
                    <td className="px-5 py-4 font-bold text-emerald-400 whitespace-nowrap">
                      ${fmt(entry.amount)}
                    </td>
                    {/* Date */}
                    <td className="px-5 py-4 text-xs theme-text-muted whitespace-nowrap">
                      {fmtDateTime(entry.payout_date)}
                    </td>
                    {/* Status */}
                    <td className="px-5 py-4">
                      <button onClick={() => toggle(entry)}
                        className="flex items-center gap-2 cursor-pointer group"
                        title={entry.is_active ? "Click to hide" : "Click to show"}>
                        {entry.is_active ? (
                          <>
                            <Eye className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">Visible</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4 theme-text-muted" />
                            <span className="text-xs font-semibold theme-text-muted group-hover:theme-text">Hidden</span>
                          </>
                        )}
                      </button>
                    </td>
                    {/* Note */}
                    <td className="px-5 py-4 text-xs theme-text-muted max-w-48 truncate" title={entry.note}>
                      {entry.note || <span className="opacity-40">—</span>}
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setModal({ type: "form", entry })}
                          className="p-2 rounded-lg hover:bg-(--bg-input) theme-text-muted hover:theme-text transition-colors cursor-pointer"
                          title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setModal({ type: "delete", entry })}
                          className="p-2 rounded-lg hover:bg-red-500/10 theme-text-muted hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && entries.length > 0 && (
          <div className="px-5 py-3 border-t theme-border">
            <p className="text-xs theme-text-muted">
              {filtered.length} entr{filtered.length !== 1 ? "ies" : "y"}
              {filtered.length !== entries.length && ` shown of ${entries.length}`}
              {" · "}
              <span className="text-emerald-400 font-medium">{activeCount} visible on landing page</span>
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === "form"   && <PayoutFormModal   entry={modal.entry} onClose={closeModal} onDone={afterAction} />}
      {modal?.type === "delete" && <DeleteConfirmModal entry={modal.entry} onClose={closeModal} onDone={afterAction} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE SHELL
// ═══════════════════════════════════════════════════════════════════════════════

const PAGE_TABS = [
  { key: "requests", label: "Withdrawal Requests", icon: Banknote },
  { key: "payouts",  label: "Live Payouts Display", icon: Globe    },
];

export default function AdminWithdrawalsPage() {
  const [activeTab, setActiveTab] = useState("requests");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold theme-text">Withdrawals</h1>
          <p className="text-sm theme-text-secondary mt-0.5">
            Manage withdrawal requests and control the live payout display on the landing page.
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 p-1 rounded-2xl bg-(--bg-input) border theme-border w-fit animate-fade-in-up">
        {PAGE_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === tab.key
                  ? "bg-primary-600/20 text-primary-400 shadow-sm"
                  : "theme-text-secondary hover:theme-text"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "requests" && <WithdrawalsTab />}
      {activeTab === "payouts"  && <LivePayoutsTab />}
    </div>
  );
}
