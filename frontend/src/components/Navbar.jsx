/**
 * Navbar — top navigation with role-aware links, theme toggle,
 * user dropdown, and mobile hamburger menu.
 */
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Sun, Moon, LogOut, Settings, Menu, X, ChevronDown } from "lucide-react";
import useAuth from "../hooks/useAuth";
import usePermission from "../hooks/usePermission";
import useTheme from "../contexts/ThemeContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isAdmin, isManagerOrAbove } = usePermission();
  const { isDark, toggleTheme } = useTheme();
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? "bg-primary-600/20 text-primary-400"
        : "theme-text-secondary hover:theme-text hover:bg-white/5"
    }`;

  const mobileLinkClass = (path) =>
    `flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? "bg-primary-600/15 text-primary-400 border border-primary-500/20"
        : "theme-text-secondary hover:theme-text hover:bg-white/5"
    }`;

  const initials =
    `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() || "?";

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", show: true },
    { to: "/admin/users", label: "Users", show: isManagerOrAbove },
    { to: "/admin/roles", label: "Roles", show: isAdmin },
    { to: "/admin/logs", label: "Logs", show: isAdmin },
  ].filter((l) => l.show);

  return (
    <nav className="glass sticky top-0 z-50 border-b theme-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg group-hover:shadow-primary-500/30 transition-shadow duration-300">
              <span className="text-white font-bold text-sm">SK</span>
            </div>
            <span className="text-base font-semibold theme-text tracking-tight hidden sm:block">
              Starter Kit
            </span>
          </Link>

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className={navLinkClass(link.to)}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Right side controls ── */}
          <div className="flex items-center gap-2">

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-lg theme-text-secondary hover:theme-text hover:bg-white/5 border theme-border hover:border-(--border-hover) transition-all duration-200"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl border theme-border hover:border-(--border-hover) hover:bg-white/5 transition-all duration-200"
              >
                {/* Avatar */}
                <div className="w-7 h-7 rounded-lg bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">{initials}</span>
                </div>
                {/* Name — hidden on small screens */}
                <span className="hidden sm:block text-sm font-medium theme-text max-w-30 truncate">
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
                  {/* User info header */}
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
                      to="/admin/settings"
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

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((prev) => !prev)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg theme-text-secondary hover:theme-text hover:bg-white/5 border theme-border transition-all duration-200"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="md:hidden border-t theme-border animate-fade-in">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className={mobileLinkClass(link.to)}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}