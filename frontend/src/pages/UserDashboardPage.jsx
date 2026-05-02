/**
 * UserDashboardPage — earnings, tasks, wallet overview for regular users.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  TrendingUp,
  Clock,
  ListChecks,
  ArrowUpRight,
  Star,
  ChevronRight,
  Banknote,
  Zap,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import useAuth from "../hooks/useAuth";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";

// ─── VIP config ─────────────────────────────────────────────────────────────

const VIP_CONFIG = {
  0: { label: "Regular", color: "neutral", next: "VIP 1" },
  1: { label: "VIP 1",   color: "info",    next: "VIP 2" },
  2: { label: "VIP 2",   color: "warning", next: "VIP 3" },
  3: { label: "VIP 3",   color: "success", next: null },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isToday(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function fmtAmount(val) {
  return Number(val ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TX_COLOR = {
  earning:    "success",
  bonus:      "primary",
  deposit:    "info",
  withdrawal: "warning",
  refund:     "neutral",
};

const TX_LABEL = {
  earning:    "Earning",
  bonus:      "Bonus",
  deposit:    "Deposit",
  withdrawal: "Withdrawal",
  refund:     "Refund",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function UserDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState({
    walletBalance: 0,
    vipLevel: 0,
    totalEarnings: 0,
    todayEarnings: 0,
    pendingWithdrawal: 0,
    availableTasks: 0,
    recentTx: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [balanceRes, txRes, withdrawalRes, tasksRes] = await Promise.all([
          axiosInstance.get("/wallet/balance/"),
          axiosInstance.get("/wallet/transactions/"),
          axiosInstance.get("/wallet/withdrawals/"),
          axiosInstance.get("/tasks/"),
        ]);

        const txList = txRes.data.results ?? txRes.data;
        const withdrawals = withdrawalRes.data.results ?? withdrawalRes.data;
        const tasks = tasksRes.data.results ?? tasksRes.data;

        const totalEarnings = txList
          .filter((t) => t.type === "earning" || t.type === "bonus")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const todayEarnings = txList
          .filter(
            (t) =>
              (t.type === "earning" || t.type === "bonus") &&
              isToday(t.created_at)
          )
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const pendingWithdrawal = withdrawals
          .filter((w) => w.status === "pending")
          .reduce((sum, w) => sum + Number(w.amount), 0);

        setData({
          walletBalance: Number(balanceRes.data.wallet_balance ?? 0),
          vipLevel: balanceRes.data.vip_level ?? 0,
          totalEarnings,
          todayEarnings,
          pendingWithdrawal,
          availableTasks: Array.isArray(tasks) ? tasks.length : 0,
          recentTx: txList.slice(0, 5),
        });
      } catch {
        // Leave defaults in place
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const vip = VIP_CONFIG[data.vipLevel] ?? VIP_CONFIG[0];
  const displayName = user?.username || user?.first_name || "there";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Greeting + VIP badge ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold theme-text">
            Welcome back,{" "}
            <span className="text-gradient">@{displayName}</span>
          </h1>
          <p className="text-sm theme-text-secondary mt-0.5">
            Here's your earnings and activity overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400 shrink-0" />
          <Badge color={vip.color} size="md">
            {vip.label}
          </Badge>
        </div>
      </div>

      {/* ── Stats grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Earnings"
          value={loading ? "—" : `$${fmtAmount(data.totalEarnings)}`}
          subtitle="All-time earnings"
          icon={TrendingUp}
          color="success"
          delay={0}
        />
        <StatCard
          title="Today's Earnings"
          value={loading ? "—" : `$${fmtAmount(data.todayEarnings)}`}
          subtitle="Earned today"
          icon={Zap}
          color="primary"
          delay={80}
        />
        <StatCard
          title="Pending Withdrawal"
          value={loading ? "—" : `$${fmtAmount(data.pendingWithdrawal)}`}
          subtitle="Awaiting approval"
          icon={Clock}
          color="warning"
          delay={160}
        />
        <StatCard
          title="Available Tasks"
          value={loading ? "—" : data.availableTasks}
          subtitle="Ready to complete"
          icon={ListChecks}
          color="info"
          delay={240}
        />
      </div>

      {/* ── Wallet balance card ───────────────────────────────────── */}
      <div
        className="card rounded-2xl p-6 mb-6 relative overflow-hidden animate-fade-in-up"
        style={{ animationDelay: "300ms" }}
      >
        {/* background glow */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-primary-600/10 blur-[60px] pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shrink-0">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm theme-text-secondary font-medium uppercase tracking-wider">
                Available Balance
              </p>
              <p className="text-3xl font-bold theme-text mt-0.5">
                ${fmtAmount(data.walletBalance)}
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 sm:shrink-0">
            <Button
              icon={ListChecks}
              size="sm"
              onClick={() => navigate("/tasks")}
            >
              Start Tasks
            </Button>
            <Button
              icon={Banknote}
              variant="secondary"
              size="sm"
              onClick={() => navigate("/withdraw")}
            >
              Withdraw
            </Button>
            {vip.next && (
              <Button
                icon={ArrowUpRight}
                variant="outline"
                size="sm"
                onClick={() => navigate("/vip")}
              >
                Upgrade to {vip.next}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent activity ───────────────────────────────────────── */}
      <div
        className="card rounded-2xl overflow-hidden animate-fade-in-up"
        style={{ animationDelay: "380ms" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b theme-border">
          <h2 className="text-base font-semibold theme-text">
            Recent Activity
          </h2>
          <button
            onClick={() => navigate("/withdraw")}
            className="text-xs text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1 transition-colors"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-(--border-primary)">
          {loading ? (
            <div className="divide-y divide-(--border-primary)">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-3.5">
                  <div className="w-16 h-5 rounded-md bg-(--bg-input) animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="w-2/3 h-3.5 rounded bg-(--bg-input) animate-pulse" />
                    <div className="w-1/3 h-2.5 rounded bg-(--bg-input) animate-pulse" />
                  </div>
                  <div className="w-14 h-4 rounded bg-(--bg-input) animate-pulse" />
                </div>
              ))}
            </div>
          ) : data.recentTx.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Wallet className="w-10 h-10 theme-text-muted mx-auto mb-3 opacity-40" />
              <p className="text-sm theme-text-muted">No transactions yet</p>
              <p className="text-xs theme-text-muted mt-1">
                Complete tasks to start earning
              </p>
            </div>
          ) : (
            data.recentTx.map((tx, i) => (
              <div
                key={tx.id ?? i}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-(--bg-card-hover) transition-colors"
              >
                {/* type badge */}
                <Badge color={TX_COLOR[tx.type] ?? "neutral"} size="sm">
                  {TX_LABEL[tx.type] ?? tx.type}
                </Badge>

                {/* description */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm theme-text truncate">
                    {tx.description || TX_LABEL[tx.type] || "Transaction"}
                  </p>
                  <p className="text-xs theme-text-muted">
                    {fmtDate(tx.created_at)}
                  </p>
                </div>

                {/* amount */}
                <span
                  className={`text-sm font-semibold shrink-0 ${
                    tx.type === "withdrawal"
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {tx.type === "withdrawal" ? "-" : "+"}${fmtAmount(tx.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
