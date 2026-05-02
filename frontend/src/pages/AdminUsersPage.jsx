/**
 * AdminUsersPage — full user management with status, VIP, balance, password actions.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, Plus, Eye, ShieldPlus, X,
  UserCheck, UserX, AlertTriangle,
  Star, Wallet, Lock, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axiosInstance";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import FormField, { Input, Select } from "../components/ui/FormField";

// ─── Config ───────────────────────────────────────────────────────────────

const VIP_COLORS  = { 0: "neutral", 1: "info", 2: "warning", 3: "success" };
const VIP_LABELS  = { 0: "Regular", 1: "VIP 1", 2: "VIP 2", 3: "VIP 3" };
const STATUS_COLORS = { active: "success", banned: "danger", suspended: "warning" };
const PAGE_SIZE   = 15;

function fmtAmount(v) {
  return Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString() : "—";
}
function initials(u) {
  return `${u?.first_name?.[0] ?? ""}${u?.last_name?.[0] ?? ""}`.toUpperCase() || "?";
}

// ─── Sub-components ───────────────────────────────────────────────────────

function FilterBar({ filters, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 px-5 py-4 border-b theme-border">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 theme-text-muted" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onChange("search", e.target.value)}
          placeholder="Search username, phone, email…"
          className="input-field pl-9 w-full"
        />
      </div>
      {/* Status filter */}
      <Select
        value={filters.status}
        onChange={(e) => onChange("status", e.target.value)}
        className="w-36"
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="banned">Banned</option>
        <option value="suspended">Suspended</option>
      </Select>
      {/* VIP filter */}
      <Select
        value={filters.vip}
        onChange={(e) => onChange("vip", e.target.value)}
        className="w-36"
      >
        <option value="">All VIP Levels</option>
        <option value="0">Regular</option>
        <option value="1">VIP 1</option>
        <option value="2">VIP 2</option>
        <option value="3">VIP 3</option>
      </Select>
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────

function ProfileModal({ user, onClose }) {
  if (!user) return null;
  const rows = [
    ["Username",        user.username || "—"],
    ["Email",           user.email],
    ["Phone",           user.phone || "—"],
    ["Referral Code",   user.referral_code || "—"],
    ["VIP Level",       VIP_LABELS[user.vip_level] ?? user.vip_level],
    ["Wallet Balance",  `$${fmtAmount(user.wallet_balance)}`],
    ["Status",          user.status],
    ["Joined",          fmtDate(user.date_joined)],
    ["Email Verified",  user.is_email_verified ? "Yes" : "No"],
    ["Roles",           (user.roles || []).join(", ") || "None"],
  ];
  return (
    <Modal isOpen onClose={onClose} title="User Profile" size="sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0">
          <span className="text-white font-bold">{initials(user)}</span>
        </div>
        <div>
          <p className="font-semibold theme-text">{user.first_name} {user.last_name}</p>
          <p className="text-xs theme-text-muted">{user.email}</p>
        </div>
      </div>
      <dl className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 text-sm py-1.5 border-b theme-border last:border-0">
            <dt className="theme-text-muted shrink-0">{label}</dt>
            <dd className="theme-text font-medium text-right truncate">{value}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}

function SetStatusModal({ user, onClose, onSave }) {
  const [status, setStatus] = useState(user?.status ?? "active");
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    await onSave(status);
    setSaving(false);
  };
  return (
    <Modal
      isOpen onClose={onClose}
      title="Change User Status"
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={handleSave}>Save</Button>
        </>
      }
    >
      <p className="text-sm theme-text-secondary mb-4">
        Update status for <span className="font-semibold theme-text">{user?.username || user?.email}</span>
      </p>
      <FormField label="Status">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
          <option value="suspended">Suspended</option>
        </Select>
      </FormField>
    </Modal>
  );
}

function SetVIPModal({ user, onClose, onSave }) {
  const [level, setLevel] = useState(String(user?.vip_level ?? 0));
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    await onSave(Number(level));
    setSaving(false);
  };
  return (
    <Modal
      isOpen onClose={onClose}
      title="Change VIP Level"
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={handleSave}>Save</Button>
        </>
      }
    >
      <p className="text-sm theme-text-secondary mb-4">
        Update VIP level for <span className="font-semibold theme-text">{user?.username || user?.email}</span>
      </p>
      <FormField label="VIP Level">
        <Select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="0">Regular (0)</option>
          <option value="1">VIP 1</option>
          <option value="2">VIP 2</option>
          <option value="3">VIP 3</option>
        </Select>
      </FormField>
    </Modal>
  );
}

function AdjustBalanceModal({ user, onClose, onSave }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error,  setError]  = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt === 0) {
      setError("Enter a non-zero amount (use negative to debit).");
      return;
    }
    setError("");
    setSaving(true);
    await onSave(amt, reason || "Manual admin adjustment");
    setSaving(false);
  };

  return (
    <Modal
      isOpen onClose={onClose}
      title="Adjust Wallet Balance"
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={handleSave}>Apply</Button>
        </>
      }
    >
      <p className="text-sm theme-text-secondary mb-4">
        Current balance:{" "}
        <span className="font-semibold theme-text">${fmtAmount(user?.wallet_balance)}</span>
      </p>
      <div className="space-y-3">
        <FormField label="Amount" error={error} helper="Positive = credit, negative = debit" required>
          <Input
            type="number" step="0.01"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(""); }}
            placeholder="e.g. 50.00 or -20.00"
          />
        </FormField>
        <FormField label="Reason" helper="Shown on the transaction record">
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Manual admin adjustment"
          />
        </FormField>
      </div>
    </Modal>
  );
}

function ResetPasswordModal({ user, onClose, onSave }) {
  const [pw,     setPw]     = useState("");
  const [error,  setError]  = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (pw.length < 8) { setError("Minimum 8 characters."); return; }
    setError("");
    setSaving(true);
    await onSave(pw);
    setSaving(false);
  };

  return (
    <Modal
      isOpen onClose={onClose}
      title="Reset Password"
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={saving} variant="danger" onClick={handleSave}>Reset</Button>
        </>
      }
    >
      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs mb-4">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        This will immediately change the user's password.
      </div>
      <FormField
        label="New Password"
        error={error}
        helper={`For: ${user?.username || user?.email}`}
        required
      >
        <Input
          type="password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); setError(""); }}
          placeholder="Min 8 characters"
          autoComplete="new-password"
        />
      </FormField>
    </Modal>
  );
}

function AssignRoleModal({ user, roles, onClose, onSave }) {
  const [roleId, setRoleId] = useState("");
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    if (!roleId) return;
    setSaving(true);
    await onSave(roleId);
    setSaving(false);
  };
  return (
    <Modal
      isOpen onClose={onClose}
      title="Assign Role"
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={saving} disabled={!roleId} onClick={handleSave}>Assign</Button>
        </>
      }
    >
      <p className="text-sm theme-text-secondary mb-4">
        Assign a role to <span className="font-semibold theme-text">{user?.username || user?.email}</span>
      </p>
      <FormField label="Role">
        <Select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
          <option value="">Select role…</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </Select>
      </FormField>
    </Modal>
  );
}

// ─── Pagination bar ───────────────────────────────────────────────────────

function Pagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage   = Math.min(page, totalPages);
  const from       = (safePage - 1) * pageSize + 1;
  const to         = Math.min(safePage * pageSize, total);

  if (total <= pageSize) return null;

  const PagBtn = ({ children, disabled, onClick }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-1.5 rounded-lg theme-text-muted hover:theme-text hover:bg-(--bg-input) transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
    >
      {children}
    </button>
  );

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t theme-border">
      <span className="text-xs theme-text-muted">
        Showing {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <PagBtn disabled={safePage === 1} onClick={() => onChange(1)}><ChevronsLeft className="w-4 h-4" /></PagBtn>
        <PagBtn disabled={safePage === 1} onClick={() => onChange(safePage - 1)}><ChevronLeft className="w-4 h-4" /></PagBtn>
        <span className="px-3 text-xs theme-text-secondary">{safePage} / {totalPages}</span>
        <PagBtn disabled={safePage === totalPages} onClick={() => onChange(safePage + 1)}><ChevronRight className="w-4 h-4" /></PagBtn>
        <PagBtn disabled={safePage === totalPages} onClick={() => onChange(totalPages)}><ChevronsRight className="w-4 h-4" /></PagBtn>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users,   setUsers]   = useState([]);
  const [roles,   setRoles]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);

  const [filters, setFilters] = useState({ search: "", status: "", vip: "" });

  // Modal state — only one open at a time
  const [modal, setModal] = useState(null); // { type, user }

  // ── Load ────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, rRes] = await Promise.all([
        axiosInstance.get("/rbac/users/"),
        axiosInstance.get("/rbac/roles/"),
      ]);
      setUsers(uRes.data.results ?? uRes.data);
      setRoles(rRes.data.results ?? rRes.data);
    } catch {
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filters + pagination ─────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase();
    return users.filter((u) => {
      if (q && ![u.username, u.email, u.phone, u.first_name, u.last_name]
            .filter(Boolean).join(" ").toLowerCase().includes(q)) return false;
      if (filters.status && u.status !== filters.status) return false;
      if (filters.vip !== "" && String(u.vip_level) !== filters.vip) return false;
      return true;
    });
  }, [users, filters]);

  const paginated = useMemo(() => {
    return filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filtered, page]);

  const handleFilterChange = (key, val) => {
    setFilters((p) => ({ ...p, [key]: val }));
    setPage(1);
  };

  // ── Actions ──────────────────────────────────────────────────────────────

  const withRefresh = (fn) => async (...args) => {
    try {
      await fn(...args);
      await load();
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Action failed.");
    }
  };

  const doSetStatus = withRefresh(async (status) => {
    await axiosInstance.post(`/rbac/users/${modal.user.id}/set-status/`, { status });
    toast.success(`Status set to "${status}".`);
  });

  const doSetVIP = withRefresh(async (vip_level) => {
    await axiosInstance.post(`/rbac/users/${modal.user.id}/set-vip/`, { vip_level });
    toast.success(`VIP level set to ${vip_level}.`);
  });

  const doAdjustBalance = withRefresh(async (amount, reason) => {
    await axiosInstance.post(`/rbac/users/${modal.user.id}/adjust-balance/`, { amount, reason });
    toast.success(`Balance adjusted by ${amount > 0 ? "+" : ""}${amount}.`);
  });

  const doResetPassword = withRefresh(async (new_password) => {
    await axiosInstance.post(`/rbac/users/${modal.user.id}/reset-password/`, { new_password });
    toast.success("Password reset successfully.");
  });

  const doAssignRole = withRefresh(async (role_id) => {
    await axiosInstance.post("/rbac/assign-role/", { user_id: modal.user.id, role_id });
    toast.success("Role assigned.");
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="User Management"
        subtitle={`${users.length} registered user${users.length !== 1 ? "s" : ""}`}
      >
        <Button
          icon={RefreshCw}
          variant="secondary"
          size="sm"
          onClick={load}
          disabled={loading}
        >
          Refresh
        </Button>
      </PageHeader>

      {/* Table card */}
      <div className="card rounded-2xl overflow-hidden animate-fade-in-up">

        <FilterBar filters={filters} onChange={handleFilterChange} />

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b theme-border">
                {["User", "Username / Phone", "Balance", "VIP", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-xs font-semibold theme-text-muted uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border-primary)">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 rounded bg-(--bg-input) animate-pulse" style={{ width: `${60 + (j * 13) % 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm theme-text-muted">
                    No users match your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((u) => (
                  <tr key={u.id} className="hover:bg-(--bg-card-hover) transition-colors">

                    {/* User */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-linear-to-br from-primary-500/20 to-primary-700/20 flex items-center justify-center shrink-0">
                          <span className="text-primary-400 text-xs font-bold">{initials(u)}</span>
                        </div>
                        <div>
                          <p className="font-medium theme-text text-sm">{u.first_name} {u.last_name}</p>
                          <p className="text-xs theme-text-muted truncate max-w-36">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Username / Phone */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-sm theme-text">{u.username || "—"}</p>
                      <p className="text-xs theme-text-muted">{u.phone || "—"}</p>
                    </td>

                    {/* Balance */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-sm font-semibold text-emerald-400">
                        ${fmtAmount(u.wallet_balance)}
                      </span>
                    </td>

                    {/* VIP */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Badge color={VIP_COLORS[u.vip_level] ?? "neutral"} size="sm">
                        {VIP_LABELS[u.vip_level] ?? `VIP ${u.vip_level}`}
                      </Badge>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Badge color={STATUS_COLORS[u.status] ?? "neutral"} dot size="sm">
                        {u.status ?? (u.is_active ? "active" : "inactive")}
                      </Badge>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-xs theme-text-secondary">{fmtDate(u.date_joined)}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="xs" icon={Eye}
                          onClick={() => setModal({ type: "profile", user: u })}
                          title="View profile"
                        />
                        <Button variant="ghost" size="xs" icon={u.status === "active" ? UserX : UserCheck}
                          onClick={() => setModal({ type: "status", user: u })}
                          title="Change status"
                        />
                        <Button variant="ghost" size="xs" icon={Star}
                          onClick={() => setModal({ type: "vip", user: u })}
                          title="Change VIP"
                        />
                        <Button variant="ghost" size="xs" icon={Wallet}
                          onClick={() => setModal({ type: "balance", user: u })}
                          title="Adjust balance"
                        />
                        <Button variant="ghost" size="xs" icon={Lock}
                          onClick={() => setModal({ type: "password", user: u })}
                          title="Reset password"
                        />
                        <Button variant="ghost" size="xs" icon={ShieldPlus}
                          onClick={() => setModal({ type: "role", user: u })}
                          title="Assign role"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          total={filtered.length}
          pageSize={PAGE_SIZE}
          onChange={setPage}
        />
      </div>

      {/* ── Modals ─────────────────────────────────────────────────── */}

      {modal?.type === "profile" && (
        <ProfileModal user={modal.user} onClose={() => setModal(null)} />
      )}
      {modal?.type === "status" && (
        <SetStatusModal user={modal.user} onClose={() => setModal(null)} onSave={doSetStatus} />
      )}
      {modal?.type === "vip" && (
        <SetVIPModal user={modal.user} onClose={() => setModal(null)} onSave={doSetVIP} />
      )}
      {modal?.type === "balance" && (
        <AdjustBalanceModal user={modal.user} onClose={() => setModal(null)} onSave={doAdjustBalance} />
      )}
      {modal?.type === "password" && (
        <ResetPasswordModal user={modal.user} onClose={() => setModal(null)} onSave={doResetPassword} />
      )}
      {modal?.type === "role" && (
        <AssignRoleModal user={modal.user} roles={roles} onClose={() => setModal(null)} onSave={doAssignRole} />
      )}
    </div>
  );
}
