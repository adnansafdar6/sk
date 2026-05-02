/**
 * Admin Task Management — task CRUD + completions approval.
 */
import { useState, useEffect, useMemo } from "react";
import {
  Plus, Search, Pencil, Trash2, ToggleLeft, ToggleRight,
  RefreshCw, ListChecks, DollarSign, Users,
  Check, X, Clock, CheckCircle, XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axiosInstance";
import Badge from "../components/ui/Badge";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val) {
  return Number(val ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const VIP_LABEL = { 0: "All", 1: "VIP 1", 2: "VIP 2", 3: "VIP 3" };

// ─── Task Form Modal ──────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: "",
  description: "",
  instructions: "",
  reward_amount: "",
  daily_limit: "1",
  vip_level_required: "0",
  status: "active",
};

function TaskFormModal({ task, onClose, onSaved }) {
  const isEdit = !!task;
  const [form, setForm] = useState(
    isEdit
      ? {
          title: task.title,
          description: task.description,
          instructions: task.instructions,
          reward_amount: task.reward_amount,
          daily_limit: String(task.daily_limit),
          vip_level_required: String(task.vip_level_required),
          status: task.status,
        }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required.";
    if (!form.reward_amount || isNaN(Number(form.reward_amount)) || Number(form.reward_amount) <= 0)
      e.reward_amount = "Enter a valid positive amount.";
    if (!form.daily_limit || isNaN(Number(form.daily_limit)) || Number(form.daily_limit) < 1)
      e.daily_limit = "Daily limit must be at least 1.";
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        reward_amount: Number(form.reward_amount),
        daily_limit: Number(form.daily_limit),
        vip_level_required: Number(form.vip_level_required),
      };
      if (isEdit) {
        await axiosInstance.patch(`/tasks/admin/${task.id}/`, payload);
        toast.success("Task updated.");
      } else {
        await axiosInstance.post("/tasks/admin/", payload);
        toast.success("Task created.");
      }
      onSaved();
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        setErrors(data);
      } else {
        toast.error(data?.detail || "Failed to save task.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
        <div className="sticky top-0 card px-6 py-4 border-b theme-border flex items-center justify-between">
          <h2 className="text-base font-semibold theme-text">
            {isEdit ? "Edit Task" : "Create Task"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg theme-text-muted hover:theme-text hover:bg-(--bg-input) transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium theme-text-secondary mb-1">Title *</label>
            <input
              value={form.title}
              onChange={set("title")}
              className="w-full px-3 py-2 rounded-xl text-sm theme-text bg-(--bg-input) border theme-border focus:outline-none focus:border-primary-500 transition-colors"
              placeholder="e.g. Watch a video"
            />
            {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium theme-text-secondary mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={2}
              className="w-full px-3 py-2 rounded-xl text-sm theme-text bg-(--bg-input) border theme-border focus:outline-none focus:border-primary-500 transition-colors resize-none"
              placeholder="Short description shown in the task card"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-medium theme-text-secondary mb-1">Instructions</label>
            <textarea
              value={form.instructions}
              onChange={set("instructions")}
              rows={4}
              className="w-full px-3 py-2 rounded-xl text-sm theme-text bg-(--bg-input) border theme-border focus:outline-none focus:border-primary-500 transition-colors resize-none"
              placeholder="Step-by-step instructions shown to the user before they submit"
            />
          </div>

          {/* Reward + Daily limit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium theme-text-secondary mb-1">Reward ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.reward_amount}
                onChange={set("reward_amount")}
                className="w-full px-3 py-2 rounded-xl text-sm theme-text bg-(--bg-input) border theme-border focus:outline-none focus:border-primary-500 transition-colors"
                placeholder="0.50"
              />
              {errors.reward_amount && (
                <p className="text-xs text-red-400 mt-1">{errors.reward_amount}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium theme-text-secondary mb-1">Daily Limit *</label>
              <input
                type="number"
                min="1"
                value={form.daily_limit}
                onChange={set("daily_limit")}
                className="w-full px-3 py-2 rounded-xl text-sm theme-text bg-(--bg-input) border theme-border focus:outline-none focus:border-primary-500 transition-colors"
              />
              {errors.daily_limit && (
                <p className="text-xs text-red-400 mt-1">{errors.daily_limit}</p>
              )}
            </div>
          </div>

          {/* VIP level + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium theme-text-secondary mb-1">Min VIP Level</label>
              <select
                value={form.vip_level_required}
                onChange={set("vip_level_required")}
                className="w-full px-3 py-2 rounded-xl text-sm theme-text bg-(--bg-input) border theme-border focus:outline-none focus:border-primary-500 transition-colors cursor-pointer"
              >
                <option value="0">0 — All Users</option>
                <option value="1">1 — VIP 1+</option>
                <option value="2">2 — VIP 2+</option>
                <option value="3">3 — VIP 3</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium theme-text-secondary mb-1">Status</label>
              <select
                value={form.status}
                onChange={set("status")}
                className="w-full px-3 py-2 rounded-xl text-sm theme-text bg-(--bg-input) border theme-border focus:outline-none focus:border-primary-500 transition-colors cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium theme-text-secondary hover:theme-text bg-(--bg-input) hover:bg-(--bg-card-hover) border theme-border transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({ task, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    setLoading(true);
    try {
      await axiosInstance.delete(`/tasks/admin/${task.id}/`);
      toast.success("Task deleted.");
      onDeleted();
    } catch {
      toast.error("Failed to delete task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-fade-in-up space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
          <Trash2 className="w-6 h-6 text-red-400" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-semibold theme-text">Delete Task?</h3>
          <p className="text-sm theme-text-secondary mt-1">
            "{task.title}" will be permanently removed. This cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium theme-text-secondary bg-(--bg-input) border theme-border hover:theme-text transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Completion status helpers ────────────────────────────────────────────────

const COMP_STATUS_COLOR = { pending: "warning", completed: "success", rejected: "danger" };
const COMP_STATUS_ICON  = {
  pending:   <Clock       className="w-3.5 h-3.5 text-amber-400" />,
  completed: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
  rejected:  <XCircle     className="w-3.5 h-3.5 text-red-400" />,
};

function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Approve / Reject modals ──────────────────────────────────────────────────

function ApproveCompletionModal({ completion, onClose, onDone }) {
  const [loading, setLoading] = useState(false);
  const confirm = async () => {
    setLoading(true);
    try {
      await axiosInstance.post(`/tasks/admin/completions/${completion.id}/approve/`);
      toast.success(`Approved — $${fmt(completion.task_reward)} credited to ${completion.user_email}.`);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to approve.");
    } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-fade-in-up space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
          <Check className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-semibold theme-text">Approve Completion?</h3>
          <p className="text-sm theme-text-secondary mt-1">
            Credit <span className="font-semibold text-emerald-400">${fmt(completion.task_reward)} USDT</span>{" "}
            to <span className="font-semibold theme-text">{completion.user_email}</span> for{" "}
            <span className="font-semibold theme-text">"{completion.task_title}"</span>?
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium theme-text-secondary bg-(--bg-input) border theme-border hover:theme-text transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={confirm} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors cursor-pointer">
            {loading ? "Approving…" : "Approve & Credit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectCompletionModal({ completion, onClose, onDone }) {
  const [loading, setLoading] = useState(false);
  const confirm = async () => {
    setLoading(true);
    try {
      await axiosInstance.post(`/tasks/admin/completions/${completion.id}/reject/`);
      toast.success("Completion rejected.");
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to reject.");
    } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-fade-in-up space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
          <X className="w-6 h-6 text-red-400" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-semibold theme-text">Reject Completion?</h3>
          <p className="text-sm theme-text-secondary mt-1">
            Reject <span className="font-semibold theme-text">"{completion.task_title}"</span>{" "}
            for <span className="font-semibold theme-text">{completion.user_email}</span>?
            No reward will be credited.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium theme-text-secondary bg-(--bg-input) border theme-border hover:theme-text transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={confirm} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-colors cursor-pointer">
            {loading ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Completions Tab ──────────────────────────────────────────────────────────

const COMP_FILTER_TABS = ["all", "pending", "completed", "rejected"];

function CompletionsTab() {
  const [completions, setCompletions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [activeTab,   setActiveTab]   = useState("pending");
  const [modal,       setModal]       = useState(null); // { type: "approve"|"reject", completion }

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/tasks/admin/completions/");
      setCompletions(res.data.results ?? res.data);
    } catch {
      toast.error("Failed to load completions.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => ({
    all:       completions.length,
    pending:   completions.filter(c => c.status === "pending").length,
    completed: completions.filter(c => c.status === "completed").length,
    rejected:  completions.filter(c => c.status === "rejected").length,
  }), [completions]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return completions.filter(c => {
      const matchTab    = activeTab === "all" || c.status === activeTab;
      const matchSearch = !q || c.user_email?.toLowerCase().includes(q) || c.task_title?.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [completions, activeTab, search]);

  const closeModal = () => setModal(null);
  const afterAction = () => { closeModal(); load(); };

  const totalPending = completions.filter(c => c.status === "pending")
    .reduce((s, c) => s + Number(c.task_reward ?? 0), 0);

  return (
    <div className="space-y-6">

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Pending Approvals", value: loading ? "—" : counts.pending,              icon: Clock,       color: "text-amber-400",   bg: "bg-amber-500/10"   },
          { label: "Pending Reward",    value: loading ? "—" : `$${fmt(totalPending)}`,     icon: DollarSign,  color: "text-primary-400",  bg: "bg-primary-500/10" },
          { label: "Total Approved",    value: loading ? "—" : counts.completed,            icon: CheckCircle, color: "text-emerald-400",  bg: "bg-emerald-500/10" },
        ].map(s => (
          <div key={s.label} className="card rounded-2xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xs theme-text-muted">{s.label}</p>
              <p className="text-lg font-bold theme-text">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs + search */}
      <div className="card rounded-2xl overflow-hidden">
        <div className="flex items-center border-b theme-border">
          <div className="flex overflow-x-auto flex-1">
            {COMP_FILTER_TABS.map(tab => (
              <button key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer border-b-2 capitalize ${
                  activeTab === tab
                    ? "border-primary-500 text-primary-400"
                    : "border-transparent theme-text-secondary hover:theme-text"
                }`}>
                {tab}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab ? "bg-primary-600/20 text-primary-300" : "bg-(--bg-input) theme-text-muted"
                }`}>{counts[tab]}</span>
              </button>
            ))}
          </div>
          <button onClick={load} disabled={loading} title="Refresh"
            className="flex items-center gap-1.5 px-4 py-3.5 text-sm theme-text-muted hover:theme-text transition-colors cursor-pointer disabled:opacity-50 border-b-2 border-transparent whitespace-nowrap shrink-0">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 theme-text-muted pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by user email or task name…"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm theme-text bg-(--bg-input) border theme-border focus:outline-none focus:border-primary-500 transition-colors" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b theme-border">
                {["User", "Task", "Reward", "Submitted", "Status", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold theme-text-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border-primary)">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {Array(6).fill(null).map((__, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 rounded bg-(--bg-input) animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm theme-text-muted">
                    No completions found.
                  </td>
                </tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-(--bg-card-hover) transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium theme-text">{c.user_email || "—"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium theme-text truncate max-w-48">{c.task_title}</p>
                  </td>
                  <td className="px-5 py-4 font-semibold text-emerald-400 whitespace-nowrap">
                    ${fmt(c.task_reward ?? c.earned_amount)}
                  </td>
                  <td className="px-5 py-4 text-xs theme-text-muted whitespace-nowrap">
                    {fmtDateTime(c.created_at)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      {COMP_STATUS_ICON[c.status]}
                      <Badge color={COMP_STATUS_COLOR[c.status] ?? "neutral"} size="sm" className="capitalize">
                        {c.status}
                      </Badge>
                    </div>
                    {c.status === "completed" && c.completed_at && (
                      <p className="text-[10px] theme-text-muted mt-0.5">{fmtDateTime(c.completed_at)}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {c.status === "pending" ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setModal({ type: "approve", completion: c })}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors cursor-pointer">
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => setModal({ type: "reject", completion: c })}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-red-600 hover:bg-red-500 transition-colors cursor-pointer">
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs theme-text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t theme-border">
            <p className="text-xs theme-text-muted">
              {filtered.length} shown{filtered.length !== completions.length && ` of ${completions.length}`}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === "approve" && (
        <ApproveCompletionModal completion={modal.completion} onClose={closeModal} onDone={afterAction} />
      )}
      {modal?.type === "reject" && (
        <RejectCompletionModal completion={modal.completion} onClose={closeModal} onDone={afterAction} />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminTasksPage() {
  const [activeTab, setActiveTab] = useState("tasks"); // "tasks" | "completions"

  // ── Tasks state ──────────────────────────────────────────────────────────
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [statusF, setStatusF] = useState("all");
  const [modal,   setModal]   = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/tasks/admin/");
      setTasks(res.data.results ?? res.data);
    } catch {
      toast.error("Failed to load tasks.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tasks.filter((t) => {
      const matchSearch = !q || t.title.toLowerCase().includes(q);
      const matchStatus = statusF === "all" || t.status === statusF;
      return matchSearch && matchStatus;
    });
  }, [tasks, search, statusF]);

  const handleToggle = async (task) => {
    try {
      await axiosInstance.post(`/tasks/admin/${task.id}/toggle-status/`);
      toast.success(`Task ${task.status === "active" ? "deactivated" : "activated"}.`);
      load();
    } catch { toast.error("Failed to toggle status."); }
  };

  const closeModal = () => setModal(null);
  const afterSave  = () => { closeModal(); load(); };

  const totalDistributed = tasks.reduce((s, t) => s + (t.total_distributed ?? 0), 0);
  const activeTasks      = tasks.filter((t) => t.status === "active").length;
  const totalCompletions = tasks.reduce((s, t) => s + (t.completions_count ?? 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold theme-text">Task Management</h1>
          <p className="text-sm theme-text-secondary mt-0.5">Create tasks and review user submissions.</p>
        </div>
        {activeTab === "tasks" && (
          <div className="flex items-center gap-2">
            <button onClick={load} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm theme-text-secondary hover:theme-text hover:bg-(--bg-input) border theme-border transition-all disabled:opacity-50 cursor-pointer">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={() => setModal({ type: "form", task: null })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 transition-colors cursor-pointer">
              <Plus className="w-4 h-4" />
              Create Task
            </button>
          </div>
        )}
      </div>

      {/* ── Tab switcher ─────────────────────────────────────────────── */}
      <div className="card rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: "40ms" }}>
        <div className="flex border-b theme-border">
          {[
            { key: "tasks",       label: "Tasks",               icon: ListChecks },
            { key: "completions", label: "Pending Approvals",   icon: Clock      },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition-colors cursor-pointer border-b-2 ${
                activeTab === key
                  ? "border-primary-500 text-primary-400"
                  : "border-transparent theme-text-secondary hover:theme-text"
              }`}>
              <Icon className="w-4 h-4" />
              {label}
              {key === "completions" && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === key ? "bg-primary-600/20 text-primary-300" : "bg-amber-500/15 text-amber-400"
                }`}>
                  {tasks.length > 0 ? "●" : ""}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "tasks" ? (
        <>
          {/* ── Summary stat cards ──────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: "50ms" }}>
            {[
              { label: "Total Tasks",      value: tasks.length,              icon: ListChecks, color: "text-primary-400" },
              { label: "Active Tasks",     value: activeTasks,               icon: ListChecks, color: "text-emerald-400" },
              { label: "Total Approved",   value: totalCompletions,          icon: Users,      color: "text-sky-400"     },
              { label: "Total Rewarded",   value: `$${fmt(totalDistributed)}`, icon: DollarSign, color: "text-amber-400" },
            ].map((s) => (
              <div key={s.label} className="card rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-(--bg-input) flex items-center justify-center shrink-0">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs theme-text-muted">{s.label}</p>
                  <p className="text-lg font-bold theme-text">{loading ? "—" : s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Filter bar ──────────────────────────────────────────── */}
          <div className="card rounded-2xl p-4 flex flex-col sm:flex-row gap-3 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 theme-text-muted pointer-events-none" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks…"
                className="w-full pl-9 pr-3 py-2 rounded-xl text-sm theme-text bg-(--bg-input) border theme-border focus:outline-none focus:border-primary-500 transition-colors" />
            </div>
            <select value={statusF} onChange={(e) => setStatusF(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm theme-text bg-(--bg-input) border theme-border focus:outline-none focus:border-primary-500 transition-colors cursor-pointer">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* ── Tasks table ─────────────────────────────────────────── */}
          <div className="card rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: "150ms" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b theme-border">
                    {["Title", "Reward", "Daily Limit", "VIP Required", "Completions", "Distributed", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold theme-text-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-primary)">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        {Array(8).fill(null).map((__, j) => (
                          <td key={j} className="px-5 py-4"><div className="h-4 rounded bg-(--bg-input) animate-pulse" /></td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-sm theme-text-muted">No tasks found.</td>
                    </tr>
                  ) : filtered.map((task) => (
                    <tr key={task.id} className="hover:bg-(--bg-card-hover) transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium theme-text truncate max-w-50">{task.title}</p>
                        {task.description && <p className="text-xs theme-text-muted truncate max-w-50 mt-0.5">{task.description}</p>}
                      </td>
                      <td className="px-5 py-4 font-semibold text-emerald-400 whitespace-nowrap">${fmt(task.reward_amount)}</td>
                      <td className="px-5 py-4 theme-text-secondary text-center">{task.daily_limit}×/day</td>
                      <td className="px-5 py-4">
                        <Badge color={task.vip_level_required === 0 ? "neutral" : "primary"} size="sm">
                          {VIP_LABEL[task.vip_level_required] ?? `VIP ${task.vip_level_required}`}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 theme-text text-center">{(task.completions_count ?? 0).toLocaleString()}</td>
                      <td className="px-5 py-4 theme-text-secondary whitespace-nowrap">${fmt(task.total_distributed)}</td>
                      <td className="px-5 py-4">
                        <Badge color={task.status === "active" ? "success" : "neutral"} size="sm">{task.status}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleToggle(task)} title={task.status === "active" ? "Deactivate" : "Activate"}
                            className="p-1.5 rounded-lg hover:bg-(--bg-input) theme-text-muted hover:theme-text transition-colors cursor-pointer">
                            {task.status === "active" ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button onClick={() => setModal({ type: "form", task })} title="Edit"
                            className="p-1.5 rounded-lg hover:bg-(--bg-input) theme-text-muted hover:text-primary-400 transition-colors cursor-pointer">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setModal({ type: "delete", task })} title="Delete"
                            className="p-1.5 rounded-lg hover:bg-(--bg-input) theme-text-muted hover:text-red-400 transition-colors cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loading && filtered.length > 0 && (
              <div className="px-5 py-3 border-t theme-border">
                <p className="text-xs theme-text-muted">
                  {filtered.length} task{filtered.length !== 1 ? "s" : ""} shown
                  {filtered.length !== tasks.length && ` (${tasks.length} total)`}
                </p>
              </div>
            )}
          </div>

          {/* ── Modals ──────────────────────────────────────────────── */}
          {modal?.type === "form"   && <TaskFormModal task={modal.task} onClose={closeModal} onSaved={afterSave} />}
          {modal?.type === "delete" && <DeleteModal   task={modal.task} onClose={closeModal} onDeleted={afterSave} />}
        </>
      ) : (
        <CompletionsTab />
      )}
    </div>
  );
}
