/**
 * VIPPage — shows DB-driven investment plans with purchase status awareness.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Shield,
  Clock,
  Wallet,
  Award,
  Crown,
  Flame,
  Zap,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import Badge from "../components/ui/Badge";

// ─── Styling palettes (cycle for any number of plans) ────────────────────────

const PLAN_GRADIENTS = [
  { gradient: "linear-gradient(135deg,#6366f1,#4f46e5)", ring: "border-indigo-500/30",  glow: "shadow-indigo-500/10"  },
  { gradient: "linear-gradient(135deg,#f59e0b,#d97706)", ring: "border-amber-500/30",   glow: "shadow-amber-500/10"   },
  { gradient: "linear-gradient(135deg,#10b981,#059669)", ring: "border-emerald-500/30", glow: "shadow-emerald-500/10" },
  { gradient: "linear-gradient(135deg,#ec4899,#db2777)", ring: "border-pink-500/30",    glow: "shadow-pink-500/10"    },
  { gradient: "linear-gradient(135deg,#3b82f6,#2563eb)", ring: "border-blue-500/30",    glow: "shadow-blue-500/10"    },
  { gradient: "linear-gradient(135deg,#8b5cf6,#7c3aed)", ring: "border-violet-500/30",  glow: "shadow-violet-500/10"  },
];

const PLAN_ICONS = [Wallet, Award, Crown, Flame, Star, Zap];

function fmt(val) {
  return Number(val ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({ plan, palette, icon: Icon, purchaseStatus, delay, onBuy }) {
  const isPending   = purchaseStatus === "pending";
  const isConfirmed = purchaseStatus === "confirmed";

  return (
    <div
      className={`
        card rounded-2xl p-6 flex flex-col gap-5 border transition-all duration-300 animate-fade-in-up
        ${isConfirmed
          ? `${palette.ring} shadow-xl ${palette.glow}`
          : "theme-border hover:glow"}
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg mb-3"
            style={{ background: palette.gradient }}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold theme-text">{plan.name}</h3>
          {plan.description && (
            <p className="text-xs theme-text-muted mt-0.5 leading-relaxed">
              {plan.description}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {plan.is_featured && <Badge color="warning" size="xs">Featured</Badge>}
          {isConfirmed       && <Badge color="success" size="xs">Active</Badge>}
          {isPending         && <Badge color="warning" size="xs">Pending</Badge>}
        </div>
      </div>

      {/* Price */}
      <div>
        <span className="text-3xl font-bold theme-text">${fmt(plan.price)}</span>
        <span className="text-sm theme-text-muted ml-1">USDT</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 py-3 border-y theme-border">
        <div className="text-center">
          <p className="text-xs theme-text-muted mb-0.5">Duration</p>
          <p className="text-sm font-semibold theme-text">{plan.duration_days}d</p>
        </div>
        <div className="text-center border-x theme-border">
          <p className="text-xs theme-text-muted mb-0.5">Daily</p>
          <p className="text-sm font-semibold theme-text">${fmt(plan.daily_earnings)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs theme-text-muted mb-0.5">Total</p>
          <p className="text-sm font-semibold theme-text">${fmt(plan.total_return)}</p>
        </div>
      </div>

      {/* Features */}
      {plan.features?.length > 0 && (
        <ul className="space-y-2 flex-1">
          {plan.features.slice(0, 5).map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm theme-text">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      )}

      {/* CTA */}
      {isConfirmed ? (
        <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Currently Active
        </div>
      ) : isPending ? (
        <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium">
          <Clock className="w-4 h-4" />
          Payment Under Review
        </div>
      ) : (
        <button
          onClick={() => onBuy(plan)}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-95 cursor-pointer"
          style={{ background: palette.gradient }}
        >
          Buy Now
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PlanSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card rounded-2xl p-6 h-96 animate-pulse" />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VIPPage() {
  const navigate = useNavigate();

  const [plans,     setPlans]     = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [plansRes, purchasesRes] = await Promise.allSettled([
          axiosInstance.get("/plans/public/"),
          axiosInstance.get("/plans/purchases/my/"),
        ]);
        if (plansRes.status === "fulfilled") {
          setPlans(plansRes.value.data.results ?? plansRes.value.data);
        }
        if (purchasesRes.status === "fulfilled") {
          setPurchases(purchasesRes.value.data.results ?? purchasesRes.value.data);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Map planId → most favourable status (confirmed > pending > rejected)
  const purchaseMap = {};
  purchases.forEach((p) => {
    const existing = purchaseMap[p.plan];
    if (!existing || p.status === "confirmed") {
      purchaseMap[p.plan] = p.status;
    }
  });

  const gridCols =
    plans.length === 1 ? "grid-cols-1 max-w-sm mx-auto" :
    plans.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto" :
    plans.length === 3 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" :
                         "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Page header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-2xl font-bold theme-text flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-400 shrink-0" />
          Investment Plans
        </h1>
        <p className="text-sm theme-text-secondary mt-0.5">
          Choose a plan, send USDT, and start earning daily returns.
        </p>
      </div>

      {/* Info banner */}
      <div
        className="card rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up"
        style={{ animationDelay: "60ms" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shrink-0">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs theme-text-muted uppercase tracking-wider font-medium">
              Available Plans
            </p>
            <p className="text-lg font-bold theme-text">
              {loading
                ? "—"
                : `${plans.length} active plan${plans.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm theme-text-secondary">
          <Shield className="w-4 h-4 text-primary-400 shrink-0" />
          All payments are verified manually by our team
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <PlanSkeleton />
      ) : plans.length === 0 ? (
        <div className="text-center py-20 theme-text-muted">
          <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No plans available right now.</p>
          <p className="text-sm mt-1">Check back soon.</p>
        </div>
      ) : (
        <div className={`grid gap-6 ${gridCols}`}>
          {plans.map((plan, i) => {
            const palette = PLAN_GRADIENTS[i % PLAN_GRADIENTS.length];
            const Icon    = PLAN_ICONS[i % PLAN_ICONS.length];
            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                palette={palette}
                icon={Icon}
                purchaseStatus={purchaseMap[plan.id]}
                delay={80 + i * 60}
                onBuy={(p) => navigate(`/payment/${p.id}`)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
