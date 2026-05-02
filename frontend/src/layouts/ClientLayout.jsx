/**
 * ClientLayout — public-facing layout with modern responsive header and footer.
 */
import { useState, useRef, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Sun, Moon, LogOut, Settings, LayoutDashboard,
  Menu, X, ChevronDown, ListChecks, Banknote, User, Star, HelpCircle, Home,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import useTheme from "../contexts/ThemeContext";
import usePermission from "../hooks/usePermission";

export default function ClientLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { isManagerOrAbove } = usePermission();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close menus on navigation
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate("/login");
  };

  const initials =
    `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b theme-border bg-(--bg-secondary)/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg group-hover:shadow-primary-500/30 transition-shadow duration-300">
                <span className="text-white font-bold text-sm">SK</span>
              </div>
              <span className="text-base font-semibold theme-text tracking-tight hidden sm:block">
                Starter Kit
              </span>
            </Link>

            {/* ── Right side ── */}
            <div className="flex items-center gap-2">

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="w-9 h-9 flex items-center justify-center rounded-xl theme-text-secondary hover:theme-text hover:bg-(--bg-input) border theme-border hover:border-(--border-hover) transition-all duration-200"
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {isAuthenticated ? (
                <>
                  {/* Task Center link — visible on desktop */}
                  <Link
                    to="/tasks"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium theme-text-secondary hover:theme-text hover:bg-(--bg-input) border theme-border hover:border-(--border-hover) transition-all duration-200"
                  >
                    <ListChecks className="w-4 h-4" />
                    <span>Tasks</span>
                  </Link>

                  {/* Withdraw link — visible on desktop */}
                  <Link
                    to="/withdraw"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium theme-text-secondary hover:theme-text hover:bg-(--bg-input) border theme-border hover:border-(--border-hover) transition-all duration-200"
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Withdraw</span>
                  </Link>

                  {/* Admin panel shortcut — visible on desktop */}
                  {isManagerOrAbove && (
                    <Link
                      to="/admin"
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium theme-text-secondary hover:theme-text hover:bg-(--bg-input) border theme-border hover:border-(--border-hover) transition-all duration-200"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                  )}

                  {/* User dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen((p) => !p)}
                      className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl border theme-border hover:border-(--border-hover) hover:bg-white/5 transition-all duration-200"
                    >
                      {/* Avatar */}
                      <div className="w-7 h-7 rounded-lg bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{initials}</span>
                      </div>
                      {/* First name — hidden on mobile */}
                      <span className="hidden sm:block text-sm font-medium theme-text max-w-28 truncate">
                        {user?.first_name}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 theme-text-secondary transition-transform duration-200 ${
                          dropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Dropdown panel */}
                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 card rounded-2xl shadow-xl border theme-border overflow-hidden animate-scale-in">
                        {/* User info */}
                        <div className="px-4 py-3.5 border-b theme-border">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0">
                              <span className="text-white text-sm font-bold">{initials}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold theme-text truncate">
                                {user?.first_name} {user?.last_name}
                              </p>
                              <p className="text-xs theme-text-muted truncate">{user?.email}</p>
                            </div>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div className="p-1.5">
                          <Link
                            to="/profile"
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm theme-text-secondary hover:theme-text hover:bg-(--bg-input) transition-all duration-200"
                          >
                            <User className="w-4 h-4 shrink-0" />
                            Profile
                          </Link>
                          <Link
                            to="/tasks"
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm theme-text-secondary hover:theme-text hover:bg-(--bg-input) transition-all duration-200"
                          >
                            <ListChecks className="w-4 h-4 shrink-0" />
                            Task Center
                          </Link>
                          <Link
                            to="/withdraw"
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm theme-text-secondary hover:theme-text hover:bg-(--bg-input) transition-all duration-200"
                          >
                            <Banknote className="w-4 h-4 shrink-0" />
                            Withdraw
                          </Link>
                          <Link
                            to="/vip"
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm theme-text-secondary hover:theme-text hover:bg-(--bg-input) transition-all duration-200"
                          >
                            <Star className="w-4 h-4 shrink-0" />
                            VIP Upgrade
                          </Link>
                          {isManagerOrAbove && (
                            <Link
                              to="/admin"
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm theme-text-secondary hover:theme-text hover:bg-(--bg-input) transition-all duration-200"
                            >
                              <LayoutDashboard className="w-4 h-4 shrink-0" />
                              Admin Panel
                            </Link>
                          )}
                          <Link
                            to="/dashboard"
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm theme-text-secondary hover:theme-text hover:bg-(--bg-input) transition-all duration-200"
                          >
                            <Home className="w-4 h-4 shrink-0" />
                            My Dashboard
                          </Link>
                          <Link
                            to="/support"
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm theme-text-secondary hover:theme-text hover:bg-(--bg-input) transition-all duration-200"
                          >
                            <HelpCircle className="w-4 h-4 shrink-0" />
                            Support
                          </Link>
                          <Link
                            to="/profile"
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm theme-text-secondary hover:theme-text hover:bg-(--bg-input) transition-all duration-200"
                          >
                            <Settings className="w-4 h-4 shrink-0" />
                            Settings
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                          >
                            <LogOut className="w-4 h-4 shrink-0" />
                            Sign out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Guest actions */
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="hidden sm:inline-flex px-4 py-2 rounded-xl text-sm font-medium theme-text-secondary hover:theme-text hover:bg-(--bg-input) border theme-border hover:border-(--border-hover) transition-all duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-linear-to-r from-primary-600 to-primary-500 text-white shadow-lg hover:shadow-primary-500/25 transition-all duration-200"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile hamburger — for all authenticated users */}
              {isAuthenticated && (
                <button
                  onClick={() => setMobileOpen((p) => !p)}
                  className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl theme-text-secondary hover:theme-text hover:bg-(--bg-input) border theme-border transition-all duration-200"
                >
                  {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {mobileOpen && isAuthenticated && (
          <div className="sm:hidden border-t theme-border animate-fade-in">
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
              <Link
                to="/dashboard"
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium theme-text-secondary hover:theme-text hover:bg-(--bg-input) transition-all duration-200"
              >
                <Home className="w-4 h-4" />
                My Dashboard
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium theme-text-secondary hover:theme-text hover:bg-(--bg-input) transition-all duration-200"
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <Link
                to="/tasks"
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium theme-text-secondary hover:theme-text hover:bg-(--bg-input) transition-all duration-200"
              >
                <ListChecks className="w-4 h-4" />
                Task Center
              </Link>
              <Link
                to="/withdraw"
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium theme-text-secondary hover:theme-text hover:bg-(--bg-input) transition-all duration-200"
              >
                <Banknote className="w-4 h-4" />
                Withdraw
              </Link>
              <Link
                to="/vip"
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium theme-text-secondary hover:theme-text hover:bg-(--bg-input) transition-all duration-200"
              >
                <Star className="w-4 h-4" />
                VIP Upgrade
              </Link>
              <Link
                to="/support"
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium theme-text-secondary hover:theme-text hover:bg-(--bg-input) transition-all duration-200"
              >
                <HelpCircle className="w-4 h-4" />
                Support
              </Link>
              {isManagerOrAbove && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium theme-text-secondary hover:theme-text hover:bg-(--bg-input) transition-all duration-200"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="border-t theme-border" style={{ background: "var(--bg-secondary)" }}>
        {/* Main columns */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

            {/* Col 1 — Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              {/* Logo */}
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">SK</span>
                </div>
                <span className="text-base font-bold theme-text tracking-tight">Starter Kit</span>
              </div>
              <p className="text-sm leading-relaxed mb-5 theme-text-muted max-w-xs">
                Earn real USDT daily by completing simple tasks. Transparent payouts, no hidden fees, and 24/7 support.
              </p>
              {/* Trust badges */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "TRC20 USDT",  color: "text-emerald-400", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.2)"  },
                  { label: "SSL Secured", color: "text-blue-400",    bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.2)"  },
                  { label: "JWT Auth",    color: "text-primary-400", bg: "rgba(99,102,241,0.08)",  border: "rgba(99,102,241,0.2)"  },
                ].map(b => (
                  <span key={b.label}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${b.color}`}
                    style={{ background: b.bg, border: `1px solid ${b.border}` }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "currentColor" }} />
                    {b.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Col 2 — Platform */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4 theme-text-muted">Platform</p>
              <ul className="space-y-2.5">
                {[
                  { label: "My Dashboard", to: "/dashboard" },
                  { label: "Task Center",  to: "/tasks"     },
                  { label: "Withdraw",     to: "/withdraw"  },
                  { label: "VIP Upgrade",  to: "/vip"       },
                  { label: "Profile",      to: "/profile"   },
                ].map(l => (
                  <li key={l.label}>
                    <Link to={l.to}
                      className="text-sm theme-text-muted hover:theme-text transition-colors duration-200">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3 — Support */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4 theme-text-muted">Support</p>
              <ul className="space-y-2.5">
                {[
                  { label: "Help Center",       to: "/support" },
                  { label: "FAQ",               to: "/#faq"    },
                  { label: "Getting Started",   to: "/register" },
                ].map(l => (
                  <li key={l.label}>
                    <Link to={l.to}
                      className="text-sm theme-text-muted hover:theme-text transition-colors duration-200">
                      {l.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <a href="https://wa.me/" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm transition-colors duration-200"
                    style={{ color: "#25d366" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    WhatsApp Chat
                  </a>
                </li>
              </ul>
              {/* Response time */}
              <div className="mt-5 p-3 rounded-xl text-xs"
                   style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}>
                <p className="font-semibold text-primary-400 mb-0.5">Average response</p>
                <p className="theme-text-muted">WhatsApp: &lt;5 min · Issues: &lt;24 hrs</p>
              </div>
            </div>

            {/* Col 4 — Legal */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4 theme-text-muted">Legal</p>
              <ul className="space-y-2.5">
                {[
                  { label: "Privacy Policy",   href: "#" },
                  { label: "Terms of Service", href: "#" },
                  { label: "Cookie Policy",    href: "#" },
                  { label: "Disclaimer",       href: "#" },
                ].map(l => (
                  <li key={l.label}>
                    <a href={l.href}
                      className="text-sm theme-text-muted hover:theme-text transition-colors duration-200">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
              {/* Availability badge */}
              <div className="mt-5 flex items-center gap-2 px-3 py-2 rounded-xl w-fit"
                   style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-400">All systems operational</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t theme-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs theme-text-muted order-2 sm:order-1">
                © {new Date().getFullYear()} SK Starter Kit. All rights reserved. · Built with ❤️ for earners worldwide.
              </p>
              <div className="flex items-center gap-5 order-1 sm:order-2">
                <Link to="/support" className="text-xs theme-text-muted hover:theme-text transition-colors">Support</Link>
                <a href="#" className="text-xs theme-text-muted hover:theme-text transition-colors">Privacy</a>
                <a href="#" className="text-xs theme-text-muted hover:theme-text transition-colors">Terms</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}