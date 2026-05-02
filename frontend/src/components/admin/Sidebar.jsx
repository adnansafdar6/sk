/**
 * Sidebar — collapsible, role-aware admin navigation.
 */
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  X,
  ListChecks,
  Banknote,
  MessageSquareQuote,
  PackageOpen,
  Wallet,
  ClipboardCheck,
} from "lucide-react";
import usePermission from "../../hooks/usePermission";

const navSections = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Users",          path: "/admin/users",          icon: Users,                roles: ["admin", "manager"] },
      { label: "Tasks",          path: "/admin/tasks",          icon: ListChecks,           roles: ["admin", "manager"] },
      { label: "Withdrawals",    path: "/admin/withdrawals",    icon: Banknote,             roles: ["admin", "manager"] },
      { label: "Member Stories", path: "/admin/member-stories", icon: MessageSquareQuote,   roles: ["admin"] },
      { label: "Plans",            path: "/admin/plans",            icon: PackageOpen, roles: ["admin"] },
      { label: "Payment Wallets", path: "/admin/payment-wallets", icon: Wallet,         roles: ["admin"] },
      { label: "Purchases",       path: "/admin/purchases",       icon: ClipboardCheck, roles: ["admin"] },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Audit Logs", path: "/admin/logs",      icon: FileText, roles: ["admin"] },
      { label: "Settings",   path: "/admin/settings",  icon: Settings, roles: ["admin"] },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { hasRole } = usePermission();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
      isActive
        ? "bg-primary-600/15 text-primary-400 shadow-sm"
        : "theme-text-secondary hover:theme-text hover:bg-(--bg-input)"
    }`;

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b theme-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shrink-0">
            <span className="text-white font-bold text-sm">SK</span>
          </div>
          {!collapsed && (
            <span className="text-base font-semibold theme-text tracking-tight whitespace-nowrap">
              Admin Panel
            </span>
          )}
        </div>
        {/* Desktop collapse */}
        <button
          onClick={onToggle}
          className="hidden lg:flex p-1.5 rounded-lg theme-text-muted hover:theme-text hover:bg-(--bg-input) transition-colors cursor-pointer"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
        </button>
        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1.5 rounded-lg theme-text-muted hover:theme-text hover:bg-(--bg-input) transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !item.roles || hasRole(...item.roles)
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.title}>
              {!collapsed && (
                <p className="px-3 mb-2 text-[10px] font-semibold theme-text-muted uppercase tracking-widest">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={linkClass}
                    onClick={onMobileClose}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t theme-border">
          <p className="text-[10px] theme-text-muted">
            SK Admin v1.0
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-(--bg-overlay) backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen sidebar-glass
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-18" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {content}
      </aside>
    </>
  );
}
