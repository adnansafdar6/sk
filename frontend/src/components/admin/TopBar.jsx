/**
 * TopBar — admin header with hamburger, theme toggle, user menu.
 */
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Sun, Moon, User, LogOut, Settings } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import useTheme from "../../contexts/ThemeContext";

export default function TopBar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 border-b theme-border bg-(--bg-secondary)/80 backdrop-blur-xl">
      {/* Left: hamburger */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl theme-text-secondary hover:theme-text hover:bg-(--bg-input) transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl theme-text-secondary hover:theme-text hover:bg-(--bg-input) transition-all duration-200 cursor-pointer"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-(--bg-input) transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium theme-text leading-tight">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-[11px] theme-text-muted leading-tight">
                {user?.email}
              </p>
            </div>
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-(--bg-secondary) border theme-border shadow-2xl overflow-hidden animate-scale-in z-50">
              <div className="px-4 py-3 border-b theme-border">
                <p className="text-sm font-medium theme-text">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs theme-text-muted">{user?.email}</p>
              </div>
              <div className="py-1">
                <DropdownItem icon={User} label="Profile" onClick={() => { navigate("/admin/settings"); setDropdownOpen(false); }} />
                <DropdownItem icon={Settings} label="Settings" onClick={() => { navigate("/admin/settings"); setDropdownOpen(false); }} />
              </div>
              <div className="border-t theme-border py-1">
                <DropdownItem icon={LogOut} label="Log Out" onClick={handleLogout} danger />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function DropdownItem({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer ${
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : "theme-text-secondary hover:theme-text hover:bg-(--bg-input)"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
