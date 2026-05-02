/**
 * Admin DashboardPage — stats, charts, recent withdrawals, quick links.
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users, UserCheck, TrendingUp, Clock,
  Banknote, ListChecks, ChevronRight, RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, Tooltip,
  CartesianGrid,
} from "recharts";
import axiosInstance from "../api/axiosInstance";
import useAuth from "../hooks/useAuth";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";

// ─── Helpers ──────────────────────────────────────────────────────────────

function fmtAmount(val) {
  return Number(val ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtShortDate(isoDate) {
  const d = new Date(isoDate);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function fmtDateTime(isoDate) {
  return new Date(isoDate).toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_COLOR = { pending: "warning", approved: "success", rejected: "danger" };

// ─── Custom recharts tooltip ───────────────────────────────────────────────
// Uses inline style for bg/border so the CSS vars resolve at runtime.

function ChartTooltip({ active, payload, label, prefix = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-primary)",
      }}
      className="rounded-xl px-3 py-2 text-xs shadow-xl"
    >
      <p className="theme-text-muted mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
          {prefix}{typeof p.value === "number" && prefix === "$"
            ? fmtAmount(p.value)
            : p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Section wrapper ───────────────────────────────────────────────────────

function Section({ title, action, children, delay = 0 }) {
  return (
    <div
      className="card rounded-2xl overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b theme-border">
        <h2 className="text-base font-semibold theme-text">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/wallet/admin/stats/");
      setData(res.data);
    } catch {
      // leave existing data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats       = data?.stats             ?? {};
  const chartData   = data?.chart_data        ?? [];
  const withdrawals = data?.recent_withdrawals ?? [];

  // Thin X-axis labels to avoid overlap (show every 5th day)
  const tickFormatter = (val, idx) => (idx % 5 === 0 ? fmtShortDate(val) : "");

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Greeting ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold theme-text">
            Welcome back, <span className="text-gradient">{user?.first_name}</span>
          </h1>
          <p className="text-sm theme-text-secondary mt-0.5">
            Here's your platform overview.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm theme-text-secondary hover:theme-text hover:bg-(--bg-input) border theme-border transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Stats grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { title: "Total Users",       value: stats.total_users,                     icon: Users,      color: "primary", delay: 0   },
          { title: "Active Today",      value: stats.active_today,                    icon: UserCheck,  color: "success", delay: 50  },
          { title: "Total Distributed", value: `$${fmtAmount(stats.total_earnings)}`, icon: TrendingUp, color: "info",    delay: 100 },
          { title: "Pending Requests",  value: stats.pending_count,                   icon: Clock,      color: "warning", delay: 150 },
          { title: "Pending Amount",    value: `$${fmtAmount(stats.pending_amount)}`, icon: Banknote,   color: "danger",  delay: 200 },
          { title: "Active Tasks",      value: stats.active_tasks,                    icon: ListChecks, color: "primary", delay: 250 },
        ].map((s) => (
          <StatCard
            key={s.title}
            title={s.title}
            value={loading ? "—" : (s.value ?? 0)}
            icon={s.icon}
            color={s.color}
            delay={s.delay}
          />
        ))}
      </div>

      {/* ── Charts row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Signups line chart */}
        <Section title="User Signups — Last 30 Days" delay={300}>
          <div className="px-4 pt-4 pb-2">
            {loading ? (
              <div className="h-52 animate-pulse rounded-xl bg-(--bg-input)" />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={tickFormatter}
                    tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="signups"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#6366f1" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Section>

        {/* Earnings bar chart */}
        <Section title="Earnings Distributed — Last 30 Days" delay={360}>
          <div className="px-4 pt-4 pb-2">
            {loading ? (
              <div className="h-52 animate-pulse rounded-xl bg-(--bg-input)" />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={tickFormatter}
                    tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip prefix="$" />} />
                  <Bar
                    dataKey="earnings"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Section>
      </div>

      {/* ── Bottom row: withdrawals + quick links ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent withdrawals */}
        <div className="lg:col-span-2">
          <Section
            title="Recent Withdrawals"
            delay={420}
            action={
              <Link
                to="/admin/withdrawals"
                className="text-xs text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1 transition-colors"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <div className="divide-y divide-(--border-primary)">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-6 py-3.5 animate-pulse">
                    <div className="w-16 h-4 rounded bg-(--bg-input)" />
                    <div className="flex-1 h-4 rounded bg-(--bg-input)" />
                    <div className="w-20 h-4 rounded bg-(--bg-input)" />
                  </div>
                ))
              ) : withdrawals.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm theme-text-muted">
                  No withdrawals yet
                </div>
              ) : (
                withdrawals.map((w, i) => (
                  <div
                    key={w.id ?? i}
                    className="flex items-center gap-3 px-6 py-3.5 hover:bg-(--bg-card-hover) transition-colors"
                  >
                    <Badge color={STATUS_COLOR[w.status] ?? "neutral"} size="sm">
                      {w.status}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono theme-text truncate">
                        {w.wallet_address || w.payment_details?.address || "—"}
                      </p>
                      <p className="text-xs theme-text-muted">
                        {fmtDateTime(w.created_at)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold theme-text shrink-0">
                      ${fmtAmount(w.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Section>
        </div>

        {/* Quick links */}
        <div
          className="card rounded-2xl overflow-hidden animate-fade-in-up"
          style={{ animationDelay: "480ms" }}
        >
          <div className="px-6 py-4 border-b theme-border">
            <h2 className="text-base font-semibold theme-text">Quick Links</h2>
          </div>
          <div className="p-3 space-y-1">
            {[
              { label: "Manage Users",      to: "/admin/users",       icon: Users,      desc: "View and edit user accounts" },
              { label: "Manage Tasks",      to: "/admin/tasks",       icon: ListChecks, desc: "Create and manage tasks"     },
              { label: "Review Withdrawals",to: "/admin/withdrawals", icon: Banknote,   desc: "Approve or reject requests"  },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-(--bg-input) transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-primary-600/10 flex items-center justify-center shrink-0 group-hover:bg-primary-600/20 transition-colors">
                  <link.icon className="w-4 h-4 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium theme-text">{link.label}</p>
                  <p className="text-xs theme-text-muted">{link.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 theme-text-muted group-hover:text-primary-400 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
