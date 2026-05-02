/**
 * PlanPaymentPage — customer-facing payment flow for purchasing a plan.
 * Route: /payment/:planId  (ProtectedRoute)
 */
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Copy, CheckCircle2, ArrowLeft, Wallet, Clock,
  TrendingUp, Zap, AlertTriangle, Send, Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axiosInstance";
import Button from "../components/ui/Button";
import FormField, { Input, Textarea } from "../components/ui/FormField";

// ─── Network badge colours ────────────────────────────────────────────────────

const NETWORK_STYLE = {
  USDT_TRC20: { bg: "rgba(245,158,11,0.1)",   border: "rgba(245,158,11,0.25)",   text: "#f59e0b", label: "TRC20 · Tron"      },
  USDT_ERC20: { bg: "rgba(99,102,241,0.1)",   border: "rgba(99,102,241,0.25)",   text: "#6366f1", label: "ERC20 · Ethereum"  },
  USDT_BEP20: { bg: "rgba(16,185,129,0.1)",   border: "rgba(16,185,129,0.25)",   text: "#10b981", label: "BEP20 · BSC"       },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  return Number(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => toast.success("Copied!")).catch(() => toast.error("Copy failed"));
}

// ─── Wallet address card ──────────────────────────────────────────────────────

function WalletCard({ wallet, selected, onSelect }) {
  const style = NETWORK_STYLE[wallet.network] ?? NETWORK_STYLE.USDT_TRC20;

  return (
    <div
      onClick={() => onSelect(wallet)}
      className="relative rounded-2xl p-4 cursor-pointer transition-all duration-200"
      style={{
        background:   selected ? style.bg   : "var(--bg-card)",
        border:       `2px solid ${selected ? style.border : "var(--border-primary)"}`,
        boxShadow:    selected ? `0 4px 24px ${style.bg}` : "none",
      }}
    >
      {/* Radio indicator */}
      <div className="flex items-start gap-3">
        <div
          className="w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-all"
          style={{ borderColor: selected ? style.text : "var(--border-hover)" }}
        >
          {selected && (
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: style.text }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {wallet.label}
            </span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
            >
              {style.label}
            </span>
          </div>

          {/* Address + copy */}
          <div className="flex items-center gap-2 mt-2 p-2.5 rounded-xl"
               style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)" }}>
            <span className="text-xs font-mono flex-1 truncate" style={{ color: "var(--text-secondary)" }}>
              {wallet.address}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); copyText(wallet.address); }}
              className="shrink-0 p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-(--bg-card)"
              title="Copy address"
            >
              <Copy className="w-3.5 h-3.5" style={{ color: style.text }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function Steps({ current }) {
  const steps = ["Select Wallet", "Send Payment", "Submit Proof"];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const num = i + 1;
        const done = num < current;
        const active = num === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: done ? "#10b981" : active ? "var(--color-primary-600)" : "var(--bg-input)",
                  color:      done || active ? "#fff" : "var(--text-muted)",
                  border:     active ? "2px solid var(--color-primary-400)" : "2px solid transparent",
                }}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : num}
              </div>
              <span className="text-[10px] font-medium whitespace-nowrap hidden sm:block"
                    style={{ color: active ? "var(--color-primary-400)" : done ? "#10b981" : "var(--text-muted)" }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 rounded"
                   style={{ background: done ? "#10b981" : "var(--border-primary)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlanPaymentPage() {
  const { planId }   = useParams();
  const navigate     = useNavigate();

  const [plan,           setPlan]           = useState(null);
  const [wallets,        setWallets]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [step,           setStep]           = useState(1);   // 1 = select wallet, 2 = sent, 3 = submit proof
  const [txHash,         setTxHash]         = useState("");
  const [notes,          setNotes]          = useState("");
  const [txError,        setTxError]        = useState("");
  const [submitting,     setSubmitting]     = useState(false);
  const [submitted,      setSubmitted]      = useState(false);

  // ─── Load plan + wallets ───

  const load = useCallback(async () => {
    try {
      const [planRes, walletsRes] = await Promise.all([
        axiosInstance.get(`/plans/public/`),
        axiosInstance.get(`/plans/public/wallets/`),
      ]);
      const allPlans = planRes.data?.results ?? planRes.data;
      const found    = allPlans.find((p) => p.id === planId);
      if (!found) { toast.error("Plan not found"); navigate("/vip"); return; }
      setPlan(found);

      const activeWallets = walletsRes.data?.results ?? walletsRes.data;
      setWallets(activeWallets);
      if (activeWallets.length === 1) setSelectedWallet(activeWallets[0]);
    } catch {
      toast.error("Failed to load payment details");
    } finally {
      setLoading(false);
    }
  }, [planId, navigate]);

  useEffect(() => { load(); }, [load]);

  // ─── Submit proof ───

  const handleSubmit = async () => {
    if (!txHash.trim()) { setTxError("Transaction hash is required"); return; }
    if (txHash.trim().length < 8) { setTxError("Enter a valid transaction hash"); return; }
    if (!selectedWallet) { toast.error("Please select a wallet"); return; }
    setTxError("");
    setSubmitting(true);
    try {
      await axiosInstance.post("/plans/purchases/", {
        plan_id:        planId,
        payment_wallet: selectedWallet.id,
        tx_hash:        txHash.trim(),
        notes:          notes.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      const d = err.response?.data;
      const msg = d?.detail || (typeof d === "object" ? Object.values(d).flat()[0] : null) || "Submission failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading ───

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading payment details…</p>
        </div>
      </div>
    );
  }

  // ─── Success state ───

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg-primary)" }}>
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-extrabold mb-3" style={{ color: "var(--text-primary)" }}>
            Payment Submitted!
          </h1>
          <p className="text-base mb-2" style={{ color: "var(--text-secondary)" }}>
            Your payment proof for <strong>{plan?.name}</strong> has been received.
          </p>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            Our team will verify your transaction and activate your plan within <strong className="text-emerald-400">24 hours</strong>.
            You'll see the update in your dashboard.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/dashboard"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-white"
              style={{ background: "linear-gradient(135deg,var(--color-primary-600),var(--color-primary-500))" }}
            >
              Go to Dashboard
            </Link>
            <Link to="/" className="text-sm" style={{ color: "var(--text-muted)" }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const noWallets = wallets.length === 0;

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "var(--bg-primary)" }}>
      <div className="max-w-5xl mx-auto">

        {/* Back link */}
        <Link
          to="/vip"
          className="inline-flex items-center gap-2 text-sm mb-6 transition-colors hover:text-primary-400"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Plans
        </Link>

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-1" style={{ color: "var(--text-primary)" }}>
            Complete Your Payment
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Follow the steps below to activate your <strong className="theme-text">{plan?.name}</strong> plan.
          </p>
        </div>

        {/* Step indicator */}
        <Steps current={step} />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── LEFT: plan summary ── */}
          <div className="lg:col-span-2">
            <div
              className="rounded-2xl p-6 sticky top-6"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
                Plan Summary
              </p>

              <h2 className="text-xl font-extrabold text-primary-400 mb-1">{plan?.name}</h2>
              {plan?.description && (
                <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>{plan.description}</p>
              )}

              {/* Price */}
              <div
                className="rounded-xl p-4 mb-4 text-center"
                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}
              >
                <p className="text-3xl font-black text-primary-400">${fmt(plan?.price)}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>One-time USDT payment</p>
              </div>

              {/* Stats */}
              <div className="space-y-3 mb-5">
                {[
                  { icon: Clock,      label: "Duration",       value: `${plan?.duration_days} days`,    color: "text-blue-400"    },
                  { icon: TrendingUp, label: "Daily Earnings", value: `$${fmt(plan?.daily_earnings)}`,  color: "text-emerald-400" },
                  { icon: Zap,        label: "Total Return",   value: `$${fmt(plan?.total_return)}`,    color: "text-amber-400"   },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                      <s.icon className={`w-4 h-4 ${s.color}`} />
                      {s.label}
                    </div>
                    <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Features */}
              {plan?.features?.length > 0 && (
                <div className="space-y-2 pt-4" style={{ borderTop: "1px solid var(--border-primary)" }}>
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      {f}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: payment steps ── */}
          <div className="lg:col-span-3 space-y-5">

            {/* No wallets warning */}
            {noWallets && (
              <div
                className="rounded-2xl p-5 flex items-start gap-3"
                style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-400 mb-1">Payment wallets not configured</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    The admin has not added any payment wallet addresses yet. Please contact support to proceed.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 1 — select wallet */}
            {!noWallets && (
              <div
                className="rounded-2xl p-6"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      Select Payment Wallet
                    </h3>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Choose which address to send your USDT to
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {wallets.map((w) => (
                    <WalletCard
                      key={w.id}
                      wallet={w}
                      selected={selectedWallet?.id === w.id}
                      onSelect={(sel) => { setSelectedWallet(sel); setStep(Math.max(step, 2)); }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2 — send payment instructions */}
            {selectedWallet && (
              <div
                className="rounded-2xl p-6"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      Send USDT Payment
                    </h3>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Send the exact amount to the address below
                    </p>
                  </div>
                </div>

                {/* Amount to send */}
                <div
                  className="rounded-xl p-4 mb-4 text-center"
                  style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}
                >
                  <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>Send exactly</p>
                  <p className="text-2xl font-extrabold text-emerald-400">${fmt(plan?.price)} USDT</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    via {NETWORK_STYLE[selectedWallet.network]?.label ?? selectedWallet.network}
                  </p>
                </div>

                {/* Address display */}
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>To this address:</p>
                <div
                  className="flex items-center gap-3 p-4 rounded-xl mb-4"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)" }}
                >
                  <Wallet className="w-5 h-5 text-primary-400 shrink-0" />
                  <span className="text-sm font-mono flex-1 break-all" style={{ color: "var(--text-primary)" }}>
                    {selectedWallet.address}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(selectedWallet.address)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                    style={{ background: "rgba(99,102,241,0.12)", color: "var(--color-primary-400)", border: "1px solid rgba(99,102,241,0.2)" }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </button>
                </div>

                {/* Warnings */}
                <div className="space-y-2">
                  {[
                    "Send only USDT on the correct network. Wrong network = lost funds.",
                    "Send the exact amount shown. Partial payments won't be accepted.",
                    "Do not send from an exchange wallet — use a personal wallet.",
                  ].map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                      {w}
                    </div>
                  ))}
                </div>

                {step < 3 && (
                  <button
                    onClick={() => setStep(3)}
                    className="mt-5 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 cursor-pointer"
                    style={{ background: "linear-gradient(135deg,var(--color-primary-600),var(--color-primary-500))" }}
                  >
                    I've Sent the Payment →
                  </button>
                )}
              </div>
            )}

            {/* STEP 3 — submit proof */}
            {step === 3 && (
              <div
                className="rounded-2xl p-6"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      Submit Payment Proof
                    </h3>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Enter your transaction ID so we can verify and activate your plan
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <FormField
                    label="Transaction Hash / ID"
                    required
                    error={txError}
                    helper="Found in your wallet's transaction history after sending"
                  >
                    <Input
                      value={txHash}
                      onChange={(e) => { setTxHash(e.target.value); setTxError(""); }}
                      placeholder="e.g. 4a3b2c1d..."
                      className="font-mono text-sm"
                    />
                  </FormField>

                  <FormField label="Additional Notes" helper="Optional — any extra info for the admin">
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="e.g. 'sent from Binance withdrawal'"
                    />
                  </FormField>

                  {/* Security note */}
                  <div
                    className="flex items-start gap-2.5 p-3 rounded-xl text-xs"
                    style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}
                  >
                    <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span style={{ color: "var(--text-muted)" }}>
                      Your transaction hash is used only to verify your payment. We never request your private keys or seed phrase.
                    </span>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    loading={submitting}
                    icon={Send}
                    className="w-full justify-center py-3 text-base"
                  >
                    Submit Payment Proof
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
