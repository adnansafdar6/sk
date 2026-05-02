/**
 * HomePage — professional landing page for the USDT task-earning platform.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Zap, TrendingUp, Users, CheckCircle, CheckCircle2,
  DollarSign, ListChecks, MessageCircle, Star, Shield,
  ArrowRight, ChevronDown, Wallet, Clock, Gift,
  Globe, Lock, Sparkles, BadgeCheck, CircleDollarSign,
  Flame, Crown, Award, CalendarDays,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import useAuth from "../hooks/useAuth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val) {
  return Number(val ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtCompact(val) {
  const n = Number(val ?? 0);
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString("en-US");
}

function timeAgo(isoDate) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ─── Count-up hook ─────────────────────────────────────────────────────────────

function useCountUp(target, duration = 2000, decimals = 0) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(parseFloat((eased * target).toFixed(decimals)));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, decimals]);

  return value;
}

function AnimatedCounter({ target, prefix = "", suffix = "", decimals = 0, className = "" }) {
  const [started, setStarted] = useState(false);
  const ref = useRef(null);
  const count = useCountUp(started ? target : 0, 2000, decimals);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {decimals > 0
        ? count.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
        : Math.round(count).toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

// ─── Scroll-reveal wrapper ────────────────────────────────────────────────────

function Reveal({ children, delay = 0, className = "" }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Live Payout Ticker ───────────────────────────────────────────────────────

function PayoutTicker({ payouts }) {
  if (!payouts.length) return null;
  const items = [...payouts, ...payouts];

  return (
    <div className="relative overflow-hidden border-y theme-border py-3" style={{ background: "var(--bg-secondary)" }}>
      {/* Label */}
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-4 gap-2"
           style={{ background: "linear-gradient(to right, var(--bg-secondary) 70%, transparent)" }}>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest whitespace-nowrap">Live Payouts</span>
      </div>

      <div className="ticker-track flex gap-6 w-max pl-44">
        {items.map((p, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 px-4 py-1.5 rounded-full whitespace-nowrap shrink-0"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)" }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{p.username}</span>
            <span className="text-sm font-bold text-emerald-400">+${fmt(p.amount)}</span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{timeAgo(p.reviewed_at)}</span>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-y-0 right-0 w-20"
           style={{ background: "linear-gradient(to left, var(--bg-secondary), transparent)" }} />
    </div>
  );
}

// ─── Testimonials Slider ──────────────────────────────────────────────────────

function TestimonialMiniCard({ t, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-2xl p-4 flex flex-col gap-3 transition-all duration-300 hover:scale-[1.02]"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg bg-linear-to-br ${t.avatar_color} flex items-center justify-center shrink-0`}>
          <span className="text-[10px] font-bold text-white">{t.avatar_initials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{t.name}</p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{t.months_active}mo</p>
        </div>
        <span className="ml-auto text-[10px] font-bold shrink-0" style={{ color: "#10b981" }}>{t.earned_amount}</span>
      </div>
      <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "var(--text-muted)" }}>
        "{t.quote}"
      </p>
    </div>
  );
}

function TestimonialsSlider({ testimonials }) {
  const [idx,         setIdx]         = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const timerRef = useRef(null);
  const n = testimonials.length;

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIdx(i  => (i + 1) % n);
      setProgressKey(k => k + 1);
    }, 5000);
  }, [n]);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  const navigate = useCallback((newIdx) => {
    setIdx(((newIdx % n) + n) % n);
    setProgressKey(k => k + 1);
    startTimer();
  }, [n, startTimer]);

  if (!n) return null;

  const t    = testimonials[idx];
  const prev = ((idx - 1) + n) % n;
  const next = (idx + 1) % n;

  return (
    <section className="py-20 border-t" style={{ borderColor: "var(--border-primary)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <Reveal className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-3">Member Stories</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
            Real earners,{" "}
            <span className="text-gradient">real results</span>
          </h2>
          <p className="text-base" style={{ color: "var(--text-secondary)" }}>
            Verified members sharing their honest experience with the platform.
          </p>
        </Reveal>

        {/* Slider row */}
        <div className="flex items-stretch gap-5 max-w-5xl mx-auto">

          {/* Prev peek — desktop only */}
          <div className="hidden lg:flex flex-col justify-center w-52 shrink-0 opacity-45 hover:opacity-70 transition-opacity duration-300">
            <TestimonialMiniCard t={testimonials[prev]} onClick={() => navigate(prev)} />
          </div>

          {/* ── Featured card ── */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div
              key={idx}
              className="relative flex-1 rounded-3xl p-8 flex flex-col overflow-hidden"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-hover)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(99,102,241,0.1)",
                animation: "slide-up-fade 0.45s ease-out both",
              }}
            >
              {/* Decorative huge quote mark */}
              <span
                className="absolute -top-4 -left-2 text-[140px] font-black leading-none select-none pointer-events-none"
                style={{ color: "rgba(99,102,241,0.06)" }}
              >
                "
              </span>

              {/* Top accent line */}
              <div className={`absolute top-0 left-10 right-10 h-px bg-linear-to-r ${t.avatar_color} opacity-50`} />

              {/* Stars + Earned */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span
                  className="text-sm font-extrabold px-3 py-1 rounded-full"
                  style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
                >
                  {t.earned_amount} earned
                </span>
              </div>

              {/* Quote */}
              <p
                className="text-lg sm:text-xl leading-relaxed flex-1 mb-8 relative z-10 italic"
                style={{ color: "var(--text-primary)" }}
              >
                "{t.quote}"
              </p>

              {/* Author row */}
              <div
                className="flex items-center gap-4 pt-6 relative z-10"
                style={{ borderTop: "1px solid var(--border-primary)" }}
              >
                <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${t.avatar_color} flex items-center justify-center shadow-lg shrink-0`}>
                  <span className="text-sm font-bold text-white">{t.avatar_initials}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{t.name}</p>
                    <BadgeCheck className="w-4 h-4 text-primary-400" />
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Member · {t.months_active} month{t.months_active !== 1 ? "s" : ""}
                  </p>
                </div>
                {/* Prev / Next arrows */}
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => navigate(prev)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-hover)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-primary)"}
                  >
                    <ChevronDown className="w-4 h-4 rotate-90" />
                  </button>
                  <button
                    onClick={() => navigate(next)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-hover)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-primary)"}
                  >
                    <ChevronDown className="w-4 h-4 -rotate-90" />
                  </button>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-0.5 rounded-full overflow-hidden" style={{ background: "var(--border-primary)" }}>
              <div
                key={progressKey}
                className="h-full rounded-full"
                style={{
                  width: "100%",
                  background: "linear-gradient(90deg, var(--color-primary-500), var(--color-primary-400))",
                  animation: "progressFill 5s linear both",
                  transformOrigin: "left",
                }}
              />
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-1.5 mt-4">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => navigate(i)}
                  className="rounded-full transition-all duration-300 cursor-pointer"
                  style={{
                    height: "6px",
                    width: i === idx ? "24px" : "6px",
                    background: i === idx ? "var(--color-primary-500)" : "var(--border-hover)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Next peek — desktop only */}
          <div className="hidden lg:flex flex-col justify-center w-52 shrink-0 opacity-45 hover:opacity-70 transition-opacity duration-300">
            <TestimonialMiniCard t={testimonials[next]} onClick={() => navigate(next)} />
          </div>
        </div>

        {/* Bottom stats */}
        <Reveal className="mt-14">
          <div className="flex flex-wrap justify-center gap-10">
            {[
              { val: "4.9/5",                    label: "Average rating"    },
              { val: `${n}+`,                    label: "Verified stories"  },
              { val: "100%",                     label: "Real withdrawals"  },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-extrabold text-gradient">{s.val}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>

      </div>
    </section>
  );
}

// ─── Live Proof Feed ──────────────────────────────────────────────────────────

const AVATAR_PALETTES = [
  { grad: "from-violet-500 to-purple-600",  ring: "rgba(139,92,246,0.35)",  bar: "#8b5cf6" },
  { grad: "from-emerald-500 to-teal-600",   ring: "rgba(16,185,129,0.35)",  bar: "#10b981" },
  { grad: "from-pink-500 to-rose-600",      ring: "rgba(236,72,153,0.35)",  bar: "#ec4899" },
  { grad: "from-amber-500 to-orange-500",   ring: "rgba(245,158,11,0.35)",  bar: "#f59e0b" },
  { grad: "from-cyan-500 to-blue-500",      ring: "rgba(6,182,212,0.35)",   bar: "#06b6d4" },
  { grad: "from-rose-500 to-red-600",       ring: "rgba(244,63,94,0.35)",   bar: "#f43f5e" },
  { grad: "from-blue-500 to-indigo-600",    ring: "rgba(99,102,241,0.35)",  bar: "#6366f1" },
  { grad: "from-teal-500 to-emerald-600",   ring: "rgba(20,184,166,0.35)",  bar: "#14b8a6" },
];

function getPalette(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTES[Math.abs(h) % AVATAR_PALETTES.length];
}

function LiveProofFeed({ payouts, stats }) {
  const VISIBLE  = 5;   // show 4 complete cards — no half-row cutoff
  const INTERVAL = 2400;
  const [items,  setItems]  = useState([]);
  const counterRef = useRef(0);
  const nextIdxRef = useRef(0);

  const maxAmount = Math.max(...(payouts.map(p => Number(p.amount))), 1);

  useEffect(() => {
    if (!payouts.length) return;
    const initial = payouts.slice(0, Math.min(VISIBLE, payouts.length)).map((p, i) => ({
      ...p, _key: i, _new: false,
    }));
    setItems(initial);
    counterRef.current = initial.length;
    nextIdxRef.current = initial.length % payouts.length;

    const timer = setInterval(() => {
      const next = {
        ...payouts[nextIdxRef.current % payouts.length],
        _key: counterRef.current++,
        _new: true,
      };
      nextIdxRef.current = (nextIdxRef.current + 1) % payouts.length;
      setItems(prev => [next, ...prev.slice(0, VISIBLE - 1).map(x => ({ ...x, _new: false }))]);
    }, INTERVAL);

    return () => clearInterval(timer);
  }, [payouts]);

  const totalPaid   = stats?.total_paid_out ?? 0;
  const totalUsers  = stats?.total_users    ?? 0;
  const avgAmount   = payouts.length
    ? payouts.reduce((s, p) => s + Number(p.amount), 0) / payouts.length
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 rounded-2xl overflow-hidden"
         style={{ border: "1px solid var(--border-primary)", boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>

      {/* ── LEFT: animated feed ─────────────────────────── */}
      <div className="lg:col-span-3 flex flex-col" style={{ background: "var(--bg-card)" }}>

        {/* Feed header */}
        <div className="flex items-center justify-between px-5 py-4"
             style={{ borderBottom: "1px solid var(--border-primary)" }}>
          <div className="flex items-center gap-2.5">
            <span className="relative flex">
              <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">Live Withdrawals</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
               style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Auto-updating
          </div>
        </div>

        {/* Entries wrapper — relative so the fade overlay is positioned inside it.
            overflow:hidden clips any animation without affecting the page layout. */}
        <div className="relative flex-1 overflow-hidden">
          <div className="p-4 space-y-2.5">
            {!items.length ? (
              <div className="flex items-center justify-center h-64 text-sm" style={{ color: "var(--text-muted)" }}>
                Loading withdrawals…
              </div>
            ) : items.map((p, idx) => {
              const palette  = getPalette(p.username || "");
              const initials = (p.username || "??").slice(0, 2).toUpperCase();
              const barPct   = Math.round((Number(p.amount) / maxAmount) * 100);
              const opacity  = idx === 0 ? 1 : idx === 1 ? 0.88 : idx === 2 ? 0.72 : 0.52;

              return (
                <div
                  key={p._key}
                  className={`relative rounded-xl overflow-hidden ${p._new ? "proof-entry-new" : ""}`}
                  style={{
                    background: p._new
                      ? "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(16,185,129,0.04))"
                      : "var(--bg-input)",
                    border: `1px solid ${p._new ? "rgba(99,102,241,0.25)" : "var(--border-primary)"}`,
                    opacity,
                  }}
                >
                  {/* Colored left accent bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl"
                       style={{ background: palette.bar }} />

                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Avatar with ring */}
                    <div className="relative shrink-0">
                      <div className={`w-10 h-10 rounded-full bg-linear-to-br ${palette.grad} flex items-center justify-center shadow-lg`}
                           style={{ boxShadow: `0 0 0 2px var(--bg-input), 0 0 0 4px ${palette.ring}` }}>
                        <span className="text-xs font-extrabold text-white tracking-wide">{initials}</span>
                      </div>
                      {p._new && (
                        <span className="proof-new-badge absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 flex items-center justify-center"
                              style={{ borderColor: "var(--bg-input)" }}>
                          <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                          {p.username}
                        </p>
                        {p._new && (
                          <span className="proof-new-badge shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider text-white"
                                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                            NEW
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="h-1 rounded-full overflow-hidden mb-1"
                           style={{ background: "var(--border-primary)", width: "100%" }}>
                        <div
                          className={p._new ? "proof-progress" : ""}
                          style={{
                            height: "100%",
                            width: `${barPct}%`,
                            background: `linear-gradient(to right, ${palette.bar}, ${palette.bar}99)`,
                            borderRadius: "9999px",
                            transition: p._new ? "none" : "width 0.3s ease",
                          }}
                        />
                      </div>

                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {timeAgo(p.reviewed_at)}
                      </p>
                    </div>

                    {/* Amount + badge */}
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-base font-extrabold text-emerald-400 leading-none">
                        +${fmt(p.amount)}
                      </p>
                      <span className="inline-flex items-center gap-0.5 mt-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-400"
                            style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)" }}>
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        PAID
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom fade — masks the container edge so the last card dissolves
              smoothly rather than being hard-clipped. */}
          <div
            className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{
              background: "linear-gradient(to bottom, transparent, var(--bg-card))",
            }}
          />
        </div>

        {/* Feed footer */}
        <div className="px-5 py-3 text-center"
             style={{ borderTop: "1px solid var(--border-primary)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Showing verified payout records ·{" "}
            <span className="font-semibold text-emerald-400">{payouts.length} recent</span>
          </p>
        </div>
      </div>

      {/* ── RIGHT: stats panel ──────────────────────────── */}
      <div className="lg:col-span-2 flex flex-col"
           style={{
             background: "linear-gradient(160deg, rgba(99,102,241,0.08) 0%, rgba(16,185,129,0.04) 100%)",
             borderLeft: "1px solid var(--border-primary)",
           }}>

        {/* Panel header */}
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-primary)" }}>
          <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Platform Stats
          </p>
        </div>

        {/* Stat rows */}
        <div className="flex-1 divide-y" style={{ "--tw-divide-opacity": 1 }}>
          {[
            {
              label:  "Total Paid Out",
              value:  `$${Number(totalPaid || 84200).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
              sub:    "All-time USDT distributed",
              color:  "text-emerald-400",
              icon:   CircleDollarSign,
              iconBg: "rgba(16,185,129,0.1)",
            },
            {
              label:  "Active Members",
              value:  `${Number(totalUsers || 12400).toLocaleString("en-US")}+`,
              sub:    "Registered earners worldwide",
              color:  "text-primary-400",
              icon:   Users,
              iconBg: "rgba(99,102,241,0.1)",
            },
            {
              label:  "Avg Withdrawal",
              value:  `$${fmt(avgAmount || 127.5)}`,
              sub:    "Per processed request",
              color:  "text-amber-400",
              icon:   TrendingUp,
              iconBg: "rgba(245,158,11,0.1)",
            },
            {
              label:  "Recent Payouts",
              value:  `${payouts.length || 20}`,
              sub:    "In this live feed",
              color:  "text-cyan-400",
              icon:   CheckCircle,
              iconBg: "rgba(6,182,212,0.1)",
            },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-4 px-6 py-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                   style={{ background: s.iconBg }}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-xl font-extrabold leading-none ${s.color}`}>{s.value}</p>
                <p className="text-xs mt-1 truncate" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--text-muted)", opacity: 0.6 }}>{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA at bottom */}
        <div className="px-6 py-5" style={{ borderTop: "1px solid var(--border-primary)" }}>
          <Link
            to="/register"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))",
              boxShadow:  "0 4px 20px rgba(99,102,241,0.3)",
            }}
          >
            Start Earning Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── FAQ Accordion ────────────────────────────────────────────────────────────

const FAQS = [
  { q: "Is it really free to start?", a: "Yes — creating an account and completing tasks is completely free. No deposit is required to earn your first USDT. VIP upgrades are optional and unlock higher-reward tasks." },
  { q: "How quickly are withdrawals processed?", a: "Most withdrawals are reviewed and processed within 24 hours. Once approved, USDT is sent directly to your TRC20 wallet address. You can track the status in real time from your dashboard." },
  { q: "What is the minimum withdrawal amount?", a: "The minimum withdrawal amount is set by the platform admin (typically $10 USDT). The current minimum is always displayed on your Withdrawal page." },
  { q: "How do VIP levels work?", a: "VIP levels (1–3) unlock access to higher-paying tasks and increase your daily earning limits. Each level requires a qualifying one-time deposit. Visit the VIP Upgrade page to see exact requirements for each tier." },
  { q: "Is my earnings balance safe?", a: "Absolutely. Your balance is stored securely and only modified by approved task completions, admin adjustments, or your own withdrawal requests. We use JWT authentication and industry-standard security practices." },
  { q: "What crypto do you support for withdrawals?", a: "We currently support USDT withdrawals exclusively via the TRC20 (Tron) network. Always double-check your wallet address before submitting — funds sent to incorrect addresses cannot be recovered." },
];

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div style={{ borderBottom: "1px solid var(--border-primary)" }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer transition-colors"
        style={{ background: "transparent" }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{q}</span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--text-muted)" }}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}>
        <p className="px-6 pb-5 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{a}</p>
      </div>
    </div>
  );
}

// ─── WhatsApp Float Button ────────────────────────────────────────────────────

function WhatsAppButton({ link }) {
  if (!link) return null;
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      style={{ background: "linear-gradient(135deg, #25d366, #128c7e)", boxShadow: "0 8px 30px rgba(37,211,102,0.4)" }}
      title="Chat on WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-white" />
      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 animate-ping opacity-75" />
      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500" />
    </a>
  );
}

// ─── Membership Tier Cards (dynamic plans) ───────────────────────────────────

const PLAN_GRADIENTS = [
  { color: "from-blue-500 to-indigo-600",    accent: "text-blue-400",    border: "rgba(99,102,241,0.35)",  bg: "rgba(99,102,241,0.07)",  gradient: "linear-gradient(135deg,#6366f1,#4338ca)" },
  { color: "from-primary-500 to-primary-700",accent: "text-primary-400", border: "rgba(99,102,241,0.45)",  bg: "rgba(99,102,241,0.10)",  gradient: "linear-gradient(135deg,#818cf8,#6366f1)" },
  { color: "from-amber-500 to-orange-500",   accent: "text-amber-400",   border: "rgba(245,158,11,0.35)",  bg: "rgba(245,158,11,0.07)",  gradient: "linear-gradient(135deg,#f59e0b,#f97316)" },
  { color: "from-rose-500 to-pink-600",      accent: "text-rose-400",    border: "rgba(244,63,94,0.35)",   bg: "rgba(244,63,94,0.07)",   gradient: "linear-gradient(135deg,#f43f5e,#db2777)" },
  { color: "from-emerald-500 to-teal-600",   accent: "text-emerald-400", border: "rgba(16,185,129,0.35)",  bg: "rgba(16,185,129,0.07)",  gradient: "linear-gradient(135deg,#10b981,#0d9488)" },
  { color: "from-violet-500 to-purple-600",  accent: "text-violet-400",  border: "rgba(139,92,246,0.35)",  bg: "rgba(139,92,246,0.07)",  gradient: "linear-gradient(135deg,#8b5cf6,#9333ea)" },
];

const PLAN_ICONS = [Wallet, Award, Crown, Flame, Star, Zap];

function PlanSkeleton() {
  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-3 animate-pulse"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}
    >
      <div className="w-12 h-12 rounded-xl" style={{ background: "var(--bg-input)" }} />
      <div className="h-5 w-28 rounded-lg" style={{ background: "var(--bg-input)" }} />
      <div className="h-3 w-40 rounded" style={{ background: "var(--bg-input)" }} />
      <div className="h-8 w-24 rounded-lg" style={{ background: "var(--bg-input)" }} />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-14 rounded-lg" style={{ background: "var(--bg-input)" }} />
        <div className="h-14 rounded-lg" style={{ background: "var(--bg-input)" }} />
      </div>
      <div className="space-y-2 flex-1 mt-1">
        {[72, 88, 64, 80].map((w, i) => (
          <div key={i} className="h-3.5 rounded" style={{ background: "var(--bg-input)", width: `${w}%` }} />
        ))}
      </div>
      <div className="h-10 rounded-xl mt-2" style={{ background: "var(--bg-input)" }} />
    </div>
  );
}

function MembershipTierCard({ plan, palette, icon: Icon, isAuthenticated }) {
  const price    = Number(plan.price);
  const daily    = Number(plan.daily_earnings);
  const total    = Number(plan.total_return);
  const features = plan.features ?? [];

  return (
    <div
      className="relative rounded-2xl p-6 flex flex-col h-full transition-all duration-300"
      style={{
        background: plan.is_featured
          ? `linear-gradient(145deg, ${palette.bg}, rgba(0,0,0,0))`
          : "var(--bg-card)",
        border: `1px solid ${plan.is_featured ? palette.border : "var(--border-primary)"}`,
        boxShadow: plan.is_featured ? `0 12px 48px ${palette.bg}` : "var(--shadow-card)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.borderColor = palette.border;
        if (!plan.is_featured) e.currentTarget.style.boxShadow = `0 8px 32px ${palette.bg}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = plan.is_featured ? palette.border : "var(--border-primary)";
        if (!plan.is_featured) e.currentTarget.style.boxShadow = "var(--shadow-card)";
      }}
    >
      {plan.is_featured && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap"
          style={{ background: palette.gradient }}
        >
          ✦ Most Popular
        </div>
      )}

      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${palette.color} flex items-center justify-center mb-4 shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>

      {/* Name + description */}
      <h3 className={`text-xl font-extrabold mb-1 ${palette.accent}`}>{plan.name}</h3>
      {plan.description && (
        <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-muted)" }}>
          {plan.description}
        </p>
      )}

      {/* Price */}
      <p className="text-2xl font-black mb-1" style={{ color: "var(--text-primary)" }}>
        ${price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        <span className="text-sm font-medium ml-1" style={{ color: "var(--text-muted)" }}>USDT</span>
      </p>
      <div className="flex items-center gap-1.5 text-xs mb-4" style={{ color: "var(--text-muted)" }}>
        <CalendarDays className="w-3.5 h-3.5" />
        {plan.duration_days}-day plan
      </div>

      {/* Earnings stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div
          className="rounded-lg p-2.5 text-center"
          style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.15)" }}
        >
          <p className="text-sm font-extrabold text-emerald-400">${daily.toFixed(2)}</p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Per Day</p>
        </div>
        <div
          className="rounded-lg p-2.5 text-center"
          style={{ background: palette.bg, border: `1px solid ${palette.border}` }}
        >
          <p className={`text-sm font-extrabold ${palette.accent}`}>
            ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Total Return</p>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-2 mb-6 flex-1">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${palette.accent}`} />
            {f}
          </div>
        ))}
      </div>

      {/* CTA */}
      <a
        href={isAuthenticated ? `/payment/${plan.id}` : "/register"}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
        style={{ background: palette.gradient }}
      >
        {isAuthenticated ? "Buy Now" : "Get Started"}
        <ArrowRight className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}


// ─── Testimonials fallback (used when API returns nothing) ────────────────────

const FALLBACK_TESTIMONIALS = [
  { name: "Sarah K.",  avatar_initials: "SK", avatar_color: "from-violet-500 to-violet-700",  earned_amount: "$420",  months_active: 3, quote: "I earned $120 in my first week just completing simple tasks. Upgrades to VIP 2 doubled everything." },
  { name: "James T.",  avatar_initials: "JT", avatar_color: "from-emerald-500 to-emerald-700", earned_amount: "$1,240", months_active: 6, quote: "Best consistent side income I've found. Withdrawals are real and fast — I've cashed out 11 times." },
  { name: "Priya M.",  avatar_initials: "PM", avatar_color: "from-pink-500 to-pink-700",       earned_amount: "$680",  months_active: 4, quote: "The tasks are simple and the payouts are legitimate. I've withdrawn over $600 in USDT already." },
  { name: "David L.",  avatar_initials: "DL", avatar_color: "from-amber-500 to-amber-700",     earned_amount: "$890",  months_active: 5, quote: "Referred 3 friends and we're all earning together. Referral bonus alone covered my VIP upgrade." },
  { name: "Anna R.",   avatar_initials: "AR", avatar_color: "from-cyan-500 to-cyan-700",       earned_amount: "$2,100", months_active: 8, quote: "8 months of consistent payouts. VIP 3 is worth every penny — earning $80–120 on good days." },
  { name: "Carlos M.", avatar_initials: "CM", avatar_color: "from-rose-500 to-rose-700",       earned_amount: "$530",  months_active: 3, quote: "Skeptical at first, but after my first withdrawal hit my wallet I was hooked. Completely legit." },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [stats,        setStats]        = useState(null);
  const [payouts,      setPayouts]      = useState([]);
  const [siteConf,     setSiteConf]     = useState({});
  const [testimonials, setTestimonials] = useState(FALLBACK_TESTIMONIALS);
  const [plans,        setPlans]        = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [faqOpen,      setFaqOpen]      = useState(null);

  useEffect(() => {
    axiosInstance.get("/wallet/public/stats/").then((r) => setStats(r.data)).catch(() => {});
    axiosInstance.get("/wallet/public/payouts/").then((r) => setPayouts(r.data)).catch(() => {});
    axiosInstance.get("/wallet/public/settings/").then((r) => setSiteConf(r.data)).catch(() => {});
    axiosInstance.get("/wallet/public/member-stories/")
      .then((r) => { if ((r.data?.length ?? 0) > 0) setTestimonials(r.data); })
      .catch(() => {});
    axiosInstance.get("/plans/public/")
      .then((r) => setPlans(r.data?.results ?? r.data))
      .catch(() => {})
      .finally(() => setPlansLoading(false));
  }, []);


  const totalUsers  = stats?.total_users    ?? 0;
  const totalPaid   = stats?.total_paid_out ?? 0;
  const tasksAvail  = stats?.tasks_available ?? 0;

  return (
    <div>

      {/* ══════════════════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Grid background */}
        <div className="hero-grid absolute inset-0 pointer-events-none" />

        {/* Glow orbs */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full pointer-events-none animate-glow-pulse"
             style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full pointer-events-none"
             style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full pointer-events-none"
             style={{ background: "radial-gradient(ellipse, rgba(16,185,129,0.05) 0%, transparent 70%)" }} />

        {/* Floating decorative elements */}
        <div className="absolute top-20 right-[12%] hidden lg:block animate-float opacity-20 pointer-events-none">
          <div className="w-14 h-14 rounded-2xl border border-primary-500/40 flex items-center justify-center"
               style={{ background: "rgba(99,102,241,0.1)" }}>
            <DollarSign className="w-7 h-7 text-primary-400" />
          </div>
        </div>
        <div className="absolute bottom-32 left-[10%] hidden lg:block animate-float-slow opacity-20 pointer-events-none">
          <div className="w-12 h-12 rounded-2xl border border-emerald-500/40 flex items-center justify-center"
               style={{ background: "rgba(16,185,129,0.1)" }}>
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32 relative">
          <div className="text-center max-w-4xl mx-auto">

            {/* Announcement pill */}
            <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-8"
                 style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", color: "var(--color-primary-400)" }}>
              <Sparkles className="w-4 h-4" />
              <span>Join {fmtCompact(totalUsers || 12400)}+ active earners worldwide</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 animate-fade-in-up leading-[1.08]"
                style={{ animationDelay: "80ms", color: "var(--text-primary)" }}>
              {siteConf.hero_title ? (
                <span className="text-gradient">{siteConf.hero_title}</span>
              ) : (
                <>
                  Earn Real{" "}
                  <span className="text-gradient">USDT Daily</span>
                  <br />
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.75em", fontWeight: 700 }}>
                    Completing Simple Tasks
                  </span>
                </>
              )}
            </h1>

            {/* Sub-headline */}
            <p className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto animate-fade-in-up leading-relaxed"
               style={{ animationDelay: "160ms", color: "var(--text-secondary)" }}>
              {siteConf.hero_subtitle || "Complete easy tasks, earn real USDT rewards, and withdraw directly to your TRC20 wallet — every single day. No investment required to start."}
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in-up"
                 style={{ animationDelay: "240ms" }}>
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base text-white transition-all duration-300 hover:scale-105"
                  style={{ background: "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))", boxShadow: "0 8px 30px rgba(99,102,241,0.35)" }}
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base text-white transition-all duration-300 hover:scale-105"
                    style={{ background: "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))", boxShadow: "0 8px 30px rgba(99,102,241,0.35)" }}
                  >
                    Start Earning Free
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-300 hover:scale-105"
                    style={{ border: "1px solid var(--border-hover)", color: "var(--text-primary)", background: "var(--bg-input)" }}
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 animate-fade-in-up"
                 style={{ animationDelay: "320ms" }}>
              {[
                { icon: Shield,      text: "SSL Secured" },
                { icon: BadgeCheck,  text: "Verified Payouts" },
                { icon: Clock,       text: "24h Withdrawals" },
                { icon: Lock,        text: "JWT Protected" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-xs font-medium"
                     style={{ color: "var(--text-muted)" }}>
                  <Icon className="w-3.5 h-3.5 text-emerald-400" />
                  {text}
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          2. LIVE PAYOUT TICKER
      ══════════════════════════════════════════════════════ */}
      {payouts.length > 0 && <PayoutTicker payouts={payouts} />}

      {/* ══════════════════════════════════════════════════════
          3. TRUST BADGES STRIP
      ══════════════════════════════════════════════════════ */}
      <section className="py-10 border-b" style={{ borderColor: "var(--border-primary)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: CircleDollarSign, label: "USDT TRC20",        sub: "Supported network",    color: "text-emerald-400", bg: "bg-emerald-500/8" },
              { icon: Zap,             label: "Instant Rewards",    sub: "Credited after review", color: "text-amber-400",  bg: "bg-amber-500/8"  },
              { icon: Globe,           label: "Global Platform",    sub: "Available worldwide",   color: "text-blue-400",   bg: "bg-blue-500/8"   },
              { icon: Gift,            label: "Referral Bonuses",   sub: "Earn for every invite", color: "text-primary-400", bg: "bg-primary-500/8" },
            ].map(({ icon: Icon, label, sub, color, bg }) => (
              <Reveal key={label}>
                <div className="flex items-center gap-3 p-4 rounded-2xl"
                     style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{label}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          4. ANIMATED STATS
      ══════════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-3">By the Numbers</p>
            <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: "var(--text-primary)" }}>
              A platform built on{" "}
              <span className="text-gradient">real results</span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Users,      label: "Active Members",    value: totalUsers || 12400,  prefix: "",  suffix: "+",  decimals: 0, color: "text-primary-400", bg: "bg-primary-500/10", border: "border-primary-500/20" },
              { icon: DollarSign, label: "Total Paid Out",    value: totalPaid  || 84200,  prefix: "$", suffix: "",   decimals: 0, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { icon: ListChecks, label: "Tasks Completed",   value: 94000,               prefix: "",  suffix: "+",  decimals: 0, color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20"  },
              { icon: TrendingUp, label: "Avg. Daily Payout", value: 2800,                prefix: "$", suffix: "",   decimals: 0, color: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/20"   },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 80}>
                <div className={`rounded-2xl p-6 text-center border ${s.border}`}
                     style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
                  <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center mx-auto mb-4`}>
                    <s.icon className={`w-6 h-6 ${s.color}`} />
                  </div>
                  <p className={`text-3xl sm:text-4xl font-extrabold mb-1 ${s.color}`}>
                    <AnimatedCounter target={s.value} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} />
                  </p>
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                    {s.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          5. FEATURES GRID
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 border-t" style={{ borderColor: "var(--border-primary)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-3">Platform Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Everything you need to{" "}
              <span className="text-gradient">earn more, faster</span>
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              Built for simplicity. Designed for consistent daily income.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: ListChecks,
                color: "from-primary-500 to-primary-700",
                title: "Daily Task Earning",
                desc: "New tasks refresh every day. Complete them at your own pace and earn USDT for each one — no skills or experience required.",
              },
              {
                icon: Crown,
                color: "from-amber-500 to-orange-600",
                title: "VIP Tier Upgrades",
                desc: "Unlock higher-paying tasks as you level up. VIP 3 earns up to 10× more per task compared to the free Regular tier.",
              },
              {
                icon: Wallet,
                color: "from-emerald-500 to-teal-600",
                title: "USDT Withdrawals",
                desc: "Withdraw directly to your TRC20 wallet any time your balance exceeds the minimum. No hidden fees, no long waits.",
              },
              {
                icon: Gift,
                color: "from-pink-500 to-rose-600",
                title: "Referral Bonuses",
                desc: "Share your unique referral code and earn bonus USDT whenever a friend joins. Your network works for you 24/7.",
              },
              {
                icon: Shield,
                color: "from-blue-500 to-cyan-600",
                title: "Secure & Transparent",
                desc: "JWT authentication, SSL-encrypted connections, and a full transaction history so you always know exactly where your money is.",
              },
              {
                icon: Zap,
                color: "from-violet-500 to-purple-600",
                title: "Instant Balance Updates",
                desc: "Your wallet balance updates the moment a task submission is approved. Track your earnings in real time from your dashboard.",
              },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 60}>
                <div
                  className="group rounded-2xl p-6 h-full transition-all duration-300"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-primary)",
                    boxShadow: "var(--shadow-card)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.background = "var(--bg-card-hover)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-primary)"; e.currentTarget.style.background = "var(--bg-card)"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${f.color} flex items-center justify-center mb-5 shadow-lg`}>
                    <f.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-base font-bold mb-2" style={{ color: "var(--text-primary)" }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          6. HOW IT WORKS
      ══════════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-3">Simple Process</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Start earning in{" "}
              <span className="text-gradient">3 easy steps</span>
            </h2>
            <p className="text-base" style={{ color: "var(--text-secondary)" }}>
              No technical skills, no investment, no experience needed.
            </p>
          </Reveal>

          <div className="relative">
            {/* Connector line (desktop) */}
            <div className="hidden lg:block absolute top-10 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-0.5"
                 style={{ background: "linear-gradient(to right, rgba(99,102,241,0.4), rgba(99,102,241,0.2), rgba(99,102,241,0.4))" }} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  icon: Users,
                  color: "from-primary-500 to-primary-700",
                  title: "Create Free Account",
                  desc: "Register in under 60 seconds. No credit card, no deposit, no ID required. Just an email and password.",
                  detail: "Free forever",
                  detailColor: "text-primary-400",
                },
                {
                  step: "02",
                  icon: ListChecks,
                  color: "from-emerald-500 to-teal-600",
                  title: "Complete Daily Tasks",
                  desc: "Browse tasks in the Task Center. Each task shows its reward up front. Complete and submit for admin review.",
                  detail: "New tasks daily",
                  detailColor: "text-emerald-400",
                },
                {
                  step: "03",
                  icon: CircleDollarSign,
                  color: "from-amber-500 to-orange-500",
                  title: "Withdraw Your USDT",
                  desc: "Once your balance hits the minimum, request a withdrawal to your TRC20 wallet. Processed within 24 hours.",
                  detail: "Fast payouts",
                  detailColor: "text-amber-400",
                },
              ].map((item, i) => (
                <Reveal key={item.step} delay={i * 120}>
                  <div className="relative text-center group">
                    {/* Step circle */}
                    <div className="relative inline-flex mb-6">
                      <div className={`w-20 h-20 rounded-2xl bg-linear-to-br ${item.color} flex items-center justify-center shadow-xl transition-transform duration-300 group-hover:scale-110`}>
                        <item.icon className="w-9 h-9 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white"
                           style={{ background: "var(--bg-primary)", border: "2px solid var(--border-hover)", color: "var(--text-muted)" }}>
                        {item.step}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>{item.desc}</p>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${item.detailColor}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {item.detail}
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {!isAuthenticated && (
            <Reveal delay={200} className="text-center mt-12">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))", boxShadow: "0 8px 30px rgba(99,102,241,0.3)" }}
              >
                Get Started Now — It's Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Reveal>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          7. MEMBERSHIP TIERS (dynamic from DB)
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 border-t" style={{ borderColor: "var(--border-primary)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-3">Membership Tiers</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Upgrade your tier,{" "}
              <span className="text-gradient">multiply your income</span>
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              Choose a plan that fits your goals. Every tier delivers guaranteed daily USDT earnings
              paid directly to your wallet.
            </p>
          </Reveal>

          {/* Skeleton while loading */}
          {plansLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[0, 1, 2, 3].map((i) => <PlanSkeleton key={i} />)}
            </div>
          )}

          {/* Dynamic plan cards */}
          {!plansLoading && plans.length > 0 && (
            <div
              className={`grid grid-cols-1 gap-5 ${
                plans.length === 1 ? "max-w-xs mx-auto"
                : plans.length === 2 ? "sm:grid-cols-2 max-w-2xl mx-auto"
                : plans.length === 3 ? "sm:grid-cols-2 lg:grid-cols-3"
                : "sm:grid-cols-2 lg:grid-cols-4"
              }`}
            >
              {plans.map((plan, i) => (
                <Reveal key={plan.id} delay={i * 80}>
                  <MembershipTierCard
                    plan={plan}
                    palette={PLAN_GRADIENTS[i % PLAN_GRADIENTS.length]}
                    icon={PLAN_ICONS[i % PLAN_ICONS.length]}
                    isAuthenticated={isAuthenticated}
                  />
                </Reveal>
              ))}
            </div>
          )}

          <Reveal delay={200} className="text-center mt-8">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Contact support on WhatsApp to activate your plan after making your deposit.{" "}
              {siteConf.whatsapp_link && (
                <a
                  href={siteConf.whatsapp_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                >
                  Chat now →
                </a>
              )}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          8. PAYMENT PROOF — animated live feed
      ══════════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-3">Transparency</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Live withdrawal{" "}
              <span className="text-gradient">proof</span>
            </h2>
            <p className="text-base" style={{ color: "var(--text-secondary)" }}>
              Real-time feed of verified withdrawals processed on our platform.
            </p>
          </Reveal>

          <Reveal>
            <LiveProofFeed payouts={payouts} stats={stats} />
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          9. TESTIMONIALS — slider
      ══════════════════════════════════════════════════════ */}
      <TestimonialsSlider testimonials={testimonials} />

      {/* ══════════════════════════════════════════════════════
          10. FAQ
      ══════════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Questions{" "}
              <span className="text-gradient">answered</span>
            </h2>
            <p className="text-base" style={{ color: "var(--text-secondary)" }}>
              Everything you need to know before you start earning.
            </p>
          </Reveal>

          <Reveal>
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
              {FAQS.map((faq, i) => (
                <FaqItem
                  key={i}
                  q={faq.q}
                  a={faq.a}
                  open={faqOpen === i}
                  onToggle={() => setFaqOpen(faqOpen === i ? null : i)}
                />
              ))}
            </div>
          </Reveal>

          {siteConf.whatsapp_link && (
            <Reveal delay={100} className="text-center mt-6">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Still have questions?{" "}
                <a href={siteConf.whatsapp_link} target="_blank" rel="noopener noreferrer"
                   className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                  Chat with us on WhatsApp →
                </a>
              </p>
            </Reveal>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          11. SUPPORT SECTION
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 border-t" style={{ borderColor: "var(--border-primary)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-3">Support Center</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              We're here{" "}
              <span className="text-gradient">24/7 to help you</span>
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              Questions about withdrawals, VIP upgrades, or tasks? Our support team responds fast — every time, around the clock.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10 ">

            {/* WhatsApp CTA card */}
            <Reveal>
              
              <a
                href={siteConf.whatsapp_link || "#support"}
                target={siteConf.whatsapp_link ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="group relative flex flex-col justify-between p-8 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 block"
                style={{
                  background: "linear-gradient(135deg, rgba(37,211,102,0.1), rgba(18,140,126,0.05))",
                  border: "1px solid rgba(37,211,102,0.25)",
                  boxShadow: "0 8px 30px rgba(37,211,102,0.06)",
                  textDecoration: "none",
                }}
              >
                {/* BG glow */}
                <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none rounded-full"
                     style={{ background: "radial-gradient(ellipse, rgba(37,211,102,0.12) 0%, transparent 70%)" }} />
                     

                <div className="flex items-start gap-4 mb-10 relative">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                       style={{ background: "linear-gradient(135deg, #25d366, #128c7e)" }}>
                    <MessageCircle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>WhatsApp Live Chat</h3>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: "rgba(37,211,102,0.15)", color: "#25d366", border: "1px solid rgba(37,211,102,0.3)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        ONLINE
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      Average response time under 5 minutes
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-10 relative">
                  {[
                    "Withdrawal status & assistance",
                    "VIP upgrade guidance & deposits",
                    "Account issues & task support",
                    "General questions & onboarding",
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      {item}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-sm font-bold group-hover:gap-3 transition-all relative"
                     style={{ color: "#25d366" }}>
                  Chat with us on WhatsApp
                  <ArrowRight className="w-4 h-4" />
                </div>
              </a>
            </Reveal>

            {/* Support features grid */}
            <Reveal delay={100}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    icon: Clock,
                    label: "24/7 Available",
                    sub: "Support never sleeps",
                    detail: "Round-the-clock",
                    color: "text-primary-400",
                    bg: "rgba(99,102,241,0.08)",
                    border: "rgba(99,102,241,0.15)",
                  },
                  {
                    icon: Zap,
                    label: "Fast Responses",
                    sub: "No long wait queues",
                    detail: "Avg. < 5 minutes",
                    color: "text-amber-400",
                    bg: "rgba(245,158,11,0.08)",
                    border: "rgba(245,158,11,0.15)",
                  },
                  {
                    icon: Shield,
                    label: "Secure Help",
                    sub: "Privacy-first approach",
                    detail: "End-to-end safe",
                    color: "text-blue-400",
                    bg: "rgba(59,130,246,0.08)",
                    border: "rgba(59,130,246,0.15)",
                  },
                  {
                    icon: Star,
                    label: "Expert Team",
                    sub: "Trained support agents",
                    detail: "Always professional",
                    color: "text-emerald-400",
                    bg: "rgba(16,185,129,0.08)",
                    border: "rgba(16,185,129,0.15)",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="flex flex-col gap-3 p-5 rounded-2xl transition-all duration-200"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = s.border; e.currentTarget.style.background = s.bg; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-primary)"; e.currentTarget.style.background = "var(--bg-card)"; }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                      <s.icon className={`w-5 h-5 ${s.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>{s.label}</p>
                      <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{s.sub}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${s.color}`}>{s.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Response time badges */}
          <Reveal delay={160}>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                { label: "WhatsApp Response", time: "< 5 min",    color: "text-emerald-400", bg: "rgba(37,211,102,0.06)",  border: "rgba(37,211,102,0.2)"  },
                { label: "Issue Resolution",  time: "< 24 hrs",   color: "text-blue-400",    bg: "rgba(59,130,246,0.06)",  border: "rgba(59,130,246,0.2)"  },
                { label: "Withdrawal Review", time: "< 24 hrs",   color: "text-amber-400",   bg: "rgba(245,158,11,0.06)",  border: "rgba(245,158,11,0.2)"  },
                { label: "Support Coverage",  time: "24/7 · 365", color: "text-primary-400", bg: "rgba(99,102,241,0.06)",  border: "rgba(99,102,241,0.2)"  },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
                     style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                  <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{s.label}:</span>
                  <span className={`font-bold ${s.color}`}>{s.time}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          12. FINAL CTA BANNER
      ══════════════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="relative rounded-3xl p-12 sm:p-16 text-center overflow-hidden">
              {/* Gradient background */}
              <div className="absolute inset-0 rounded-3xl"
                   style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.25) 0%, rgba(99,102,241,0.1) 50%, rgba(16,185,129,0.08) 100%)", border: "1px solid rgba(99,102,241,0.3)" }} />
              {/* Glow orbs inside */}
              <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full pointer-events-none"
                   style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)" }} />
              <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full pointer-events-none"
                   style={{ background: "radial-gradient(ellipse, rgba(16,185,129,0.1) 0%, transparent 70%)" }} />

              <div className="relative">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
                     style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "var(--color-primary-400)" }}>
                  <Zap className="w-4 h-4" />
                  Start in under 60 seconds
                </div>

                <h2 className="text-3xl sm:text-5xl font-extrabold mb-5 leading-tight" style={{ color: "var(--text-primary)" }}>
                  Ready to earn your first{" "}
                  <span className="text-gradient">USDT today?</span>
                </h2>

                <p className="text-lg mb-8 max-w-lg mx-auto" style={{ color: "var(--text-secondary)" }}>
                  Join thousands of members who earn daily crypto rewards. Free to start, no investment required.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    to={isAuthenticated ? "/dashboard" : "/register"}
                    className="group inline-flex items-center gap-2.5 px-10 py-4 rounded-2xl font-bold text-base text-white transition-all duration-300 hover:scale-105"
                    style={{ background: "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))", boxShadow: "0 10px 40px rgba(99,102,241,0.4)" }}
                  >
                    {isAuthenticated ? "Go to Dashboard" : "Create Free Account"}
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  {!isAuthenticated && (
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl font-semibold text-base transition-all hover:scale-105"
                      style={{ color: "var(--text-secondary)", background: "var(--bg-input)", border: "1px solid var(--border-primary)" }}
                    >
                      Already have an account?
                    </Link>
                  )}
                </div>

                {/* Mini social proof */}
                <div className="mt-8 flex items-center justify-center gap-3">
                  <div className="flex -space-x-2">
                    {["from-violet-500 to-violet-700", "from-emerald-500 to-emerald-700", "from-pink-500 to-pink-700", "from-amber-500 to-amber-700"].map((c, i) => (
                      <div key={i} className={`w-8 h-8 rounded-full bg-linear-to-br ${c} border-2 flex items-center justify-center text-[9px] font-bold text-white`}
                           style={{ borderColor: "var(--bg-primary)" }}>
                        {["SK","JT","PM","DL"][i]}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    <span className="font-semibold text-emerald-400">{fmtCompact(totalUsers || 12400)}+ members</span> already earning
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── WhatsApp float ───────────────────────────────────────────── */}
      <WhatsAppButton link={siteConf.whatsapp_link || stats?.whatsapp_link} />

    </div>
  );
}
