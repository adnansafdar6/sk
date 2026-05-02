/**
 * WithdrawalPage — submit withdrawals and view history.
 */
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Wallet,
  Banknote,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  RefreshCw,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import useAuth from "../hooks/useAuth";
import FormField, { Input } from "../components/ui/FormField";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

// ─── Helpers ──────────────────────────────────────────────────────────────

function fmtAmount(val) {
  return Number(val ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateAddress(addr) {
  if (!addr || addr.length < 16) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

const STATUS_COLOR = {
  pending:  "warning",
  approved: "success",
  rejected: "danger",
};

const STATUS_ICON = {
  pending:  Clock,
  approved: CheckCircle2,
  rejected: XCircle,
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function WithdrawalPage() {
  const { user, setUser } = useAuth();

  const [balance, setBalance]     = useState(0);
  const [minAmount, setMinAmount] = useState(10);
  const [history, setHistory]     = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [form, setForm]         = useState({ amount: "", wallet_address: "" });
  const [errors, setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch balance + history ───────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoadingData(true);
    setLoadError(false);
    try {
      const [balRes, histRes] = await Promise.all([
        axiosInstance.get("/wallet/balance/"),
        axiosInstance.get("/wallet/withdrawals/"),
      ]);
      setBalance(Number(balRes.data.wallet_balance ?? 0));
      setMinAmount(Number(balRes.data.min_withdrawal_amount ?? 10));
      const list = histRes.data.results ?? histRes.data ?? [];
      setHistory(Array.isArray(list) ? list : []);
    } catch {
      setLoadError(true);
      toast.error("Failed to load wallet data.");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = () => {
    const errs = {};
    const amt = Number(form.amount);

    if (!form.amount || isNaN(amt) || amt <= 0) {
      errs.amount = "Please enter a valid amount.";
    } else if (amt < minAmount) {
      errs.amount = `Minimum withdrawal is $${fmtAmount(minAmount)} USDT.`;
    } else if (amt > balance) {
      errs.amount = "Amount exceeds your available balance.";
    }

    if (!form.wallet_address.trim()) {
      errs.wallet_address = "Wallet address is required.";
    } else if (form.wallet_address.trim().length < 10) {
      errs.wallet_address = "Please enter a valid TRC20 wallet address.";
    }

    return errs;
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await axiosInstance.post("/wallet/withdrawals/request/", {
        amount: form.amount,
        wallet_address: form.wallet_address.trim(),
      });

      const newWithdrawal = res.data;

      // Update local state immediately
      setBalance((prev) => prev - Number(form.amount));
      setHistory((prev) => [newWithdrawal, ...prev]);
      setForm({ amount: "", wallet_address: "" });

      // Sync auth context balance
      if (setUser) {
        setUser((prev) =>
          prev
            ? { ...prev, wallet_balance: Number(prev.wallet_balance) - Number(form.amount) }
            : prev
        );
      }

      toast.success(`Withdrawal of $${fmtAmount(form.amount)} USDT submitted!`);
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === "object" && !data.detail) {
        setErrors(data);
      } else {
        toast.error(data?.detail || "Submission failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    }
  };

  const copyAddress = (addr) => {
    navigator.clipboard.writeText(addr);
    toast.success("Address copied!");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Page header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-2xl font-bold theme-text flex items-center gap-2">
          <Banknote className="w-6 h-6 text-primary-400 shrink-0" />
          Withdraw Funds
        </h1>
        <p className="text-sm theme-text-secondary mt-0.5">
          Withdraw your USDT earnings to your TRC20 wallet.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Left: balance + form ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Balance card */}
          <div
            className="card rounded-2xl p-5 relative overflow-hidden animate-fade-in-up"
            style={{ animationDelay: "60ms" }}
          >
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-primary-600/10 blur-[50px] pointer-events-none" />
            <div className="flex items-center gap-3 mb-4 relative">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs theme-text-muted uppercase tracking-wider font-medium">
                  Available Balance
                </p>
                <p className="text-2xl font-bold theme-text">
                  {loadingData ? "—" : `$${fmtAmount(balance)}`}
                  <span className="text-sm font-normal theme-text-muted ml-1">USDT</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Minimum withdrawal: ${fmtAmount(minAmount)} USDT
            </div>
          </div>

          {/* Withdrawal form */}
          <div
            className="card rounded-2xl p-5 animate-fade-in-up"
            style={{ animationDelay: "120ms" }}
          >
            <h2 className="text-base font-semibold theme-text mb-4">
              New Withdrawal
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                label="Amount (USDT)"
                error={errors.amount}
                helper={`Min $${fmtAmount(minAmount)} · Max $${fmtAmount(balance)}`}
                required
              >
                <div className="relative">
                  <Input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={`${minAmount}.00`}
                    value={form.amount}
                    onChange={handleChange}
                    className="pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, amount: String(balance) }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-primary-400 hover:text-primary-300 font-semibold px-1.5 py-0.5 rounded transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </FormField>

              <FormField
                label="TRC20 Wallet Address"
                error={errors.wallet_address}
                helper="Only USDT TRC20 addresses are accepted."
                required
              >
                <Input
                  name="wallet_address"
                  type="text"
                  placeholder="T..."
                  value={form.wallet_address}
                  onChange={handleChange}
                  spellCheck={false}
                  autoComplete="off"
                />
              </FormField>

              <Button
                type="submit"
                loading={submitting}
                className="w-full"
                disabled={loadingData || balance <= 0}
              >
                {submitting ? "Processing…" : "Submit Withdrawal"}
              </Button>
            </form>
          </div>
        </div>

        {/* ── Right: withdrawal history ─────────────────────────────── */}
        <div
          className="lg:col-span-3 card rounded-2xl overflow-hidden animate-fade-in-up"
          style={{ animationDelay: "180ms" }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b theme-border">
            <h2 className="text-base font-semibold theme-text">
              Withdrawal History
            </h2>
            <button
              onClick={loadData}
              disabled={loadingData}
              className="p-1.5 rounded-lg theme-text-muted hover:theme-text hover:bg-(--bg-input) transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loadingData ? (
            <div className="divide-y divide-(--border-primary)">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-3 animate-pulse">
                  <div className="w-16 h-5 rounded bg-(--bg-input)" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 rounded bg-(--bg-input) w-3/4" />
                    <div className="h-3 rounded bg-(--bg-input) w-1/2" />
                  </div>
                  <div className="w-20 h-5 rounded bg-(--bg-input)" />
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 opacity-60 mb-3" />
              <p className="text-sm theme-text-muted">Failed to load withdrawal history</p>
              <button
                onClick={loadData}
                className="mt-3 flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try again
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Banknote className="w-10 h-10 theme-text-muted opacity-30 mb-3" />
              <p className="text-sm theme-text-muted">No withdrawals yet</p>
              <p className="text-xs theme-text-muted mt-1">
                Your withdrawal history will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-(--border-primary)">
              {history.map((w, i) => {
                const StatusIcon = STATUS_ICON[w.status] ?? Clock;
                const addr = w.wallet_address || w.payment_details?.address || "";
                return (
                  <div
                    key={w.id ?? i}
                    className="flex items-start gap-3 px-5 py-4 hover:bg-(--bg-card-hover) transition-colors"
                  >
                    {/* Status icon */}
                    <div className="mt-0.5 shrink-0">
                      <StatusIcon
                        className={`w-4 h-4 ${
                          w.status === "approved"
                            ? "text-emerald-400"
                            : w.status === "rejected"
                            ? "text-red-400"
                            : "text-amber-400"
                        }`}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold theme-text">
                          ${fmtAmount(w.amount)} USDT
                        </span>
                        <Badge color={STATUS_COLOR[w.status] ?? "neutral"} size="sm">
                          {w.status === "pending" ? "Pending" : w.status === "approved" ? "Approved" : w.status === "rejected" ? "Rejected" : w.status}
                        </Badge>
                      </div>

                      {/* Wallet address */}
                      {addr && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs theme-text-muted font-mono">
                            {truncateAddress(addr)}
                          </span>
                          <button
                            onClick={() => copyAddress(addr)}
                            className="text-primary-400/60 hover:text-primary-400 transition-colors"
                            title="Copy address"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <p className="text-xs theme-text-muted mt-1">
                        {fmtDate(w.created_at)}
                        {w.reviewed_at && ` · Reviewed ${fmtDate(w.reviewed_at)}`}
                      </p>

                      {/* Admin note on rejection */}
                      {w.status === "rejected" && w.admin_note && (
                        <p className="text-xs text-red-400 mt-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5">
                          {w.admin_note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
