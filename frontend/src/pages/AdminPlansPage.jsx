/**
 * AdminPlansPage — full CRUD for investment / subscription plans.
 */
import { useState, useEffect, useCallback } from "react";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Star, StarOff,
  DollarSign, Clock, TrendingUp, Zap, X,
} from "lucide-react";
import toast from "react-hot-toast";
import plansApi from "../api/plansApi";
import DataTable from "../components/ui/DataTable";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import FormField, { Input, Textarea } from "../components/ui/FormField";

// ─── Empty form state ─────────────────────────────────────────────────────────

const EMPTY = {
  name: "",
  description: "",
  price: "",
  duration_days: 30,
  daily_earnings: "",
  total_return: "",
  features: [],
  is_active: true,
  is_featured: false,
  sort_order: 0,
};

// ─── Feature tag input ────────────────────────────────────────────────────────

function FeatureTagInput({ features, onChange }) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const val = draft.trim();
    if (!val || features.includes(val)) { setDraft(""); return; }
    onChange([...features, val]);
    setDraft("");
  };

  const remove = (idx) => onChange(features.filter((_, i) => i !== idx));

  const handleKey = (e) => {
    if (e.key === "Enter") { e.preventDefault(); add(); }
    if (e.key === "Backspace" && !draft && features.length) remove(features.length - 1);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {features.map((f, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium
                       bg-primary-600/10 text-primary-400 border border-primary-500/20"
          >
            {f}
            <button
              type="button"
              onClick={() => remove(i)}
              className="hover:text-red-400 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a feature and press Enter…"
          className="flex-1"
        />
        <Button type="button" variant="secondary" size="sm" onClick={add} disabled={!draft.trim()}>
          Add
        </Button>
      </div>
      <p className="mt-1 text-xs theme-text-muted">Press Enter or click Add after each feature.</p>
    </div>
  );
}

// ─── Stat chip ────────────────────────────────────────────────────────────────

function StatChip({ icon: Icon, label, value, color }) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${color}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="font-medium">{value}</span>
      <span className="opacity-70">{label}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminPlansPage() {
  const [plans,     setPlans]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editItem,  setEditItem]  = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [formData,  setFormData]  = useState(EMPTY);
  const [formErrors,setFormErrors]= useState({});
  const [saving,    setSaving]    = useState(false);

  // ─── Fetch ───────────────────────────────────────────────────────────────

  const fetchPlans = useCallback(async () => {
    try {
      const res = await plansApi.list();
      setPlans(res.data.results ?? res.data);
    } catch {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  // ─── Validation ──────────────────────────────────────────────────────────

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Name is required";
    if (formData.price === "" || Number(formData.price) < 0)
      errs.price = "Price must be 0 or greater";
    if (!formData.duration_days || Number(formData.duration_days) < 1)
      errs.duration_days = "Duration must be at least 1 day";
    if (formData.daily_earnings === "" || Number(formData.daily_earnings) < 0)
      errs.daily_earnings = "Daily earnings must be 0 or greater";
    if (formData.total_return === "" || Number(formData.total_return) < 0)
      errs.total_return = "Total return must be 0 or greater";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Save (Create / Update) ──────────────────────────────────────────────

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...formData,
        price:          Number(formData.price),
        duration_days:  Number(formData.duration_days),
        daily_earnings: Number(formData.daily_earnings),
        total_return:   Number(formData.total_return),
        sort_order:     Number(formData.sort_order),
      };
      if (editItem) {
        await plansApi.update(editItem.id, payload);
        toast.success("Plan updated");
      } else {
        await plansApi.create(payload);
        toast.success("Plan created");
      }
      closeForm();
      fetchPlans();
    } catch (err) {
      const d = err.response?.data;
      if (d && typeof d === "object") {
        const first = Object.values(d).flat()[0];
        toast.error(typeof first === "string" ? first : "Operation failed");
      } else {
        toast.error("Operation failed");
      }
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!delTarget) return;
    setSaving(true);
    try {
      await plansApi.remove(delTarget);
      toast.success("Plan deleted");
      setDelTarget(null);
      fetchPlans();
    } catch {
      toast.error("Failed to delete plan");
    } finally {
      setSaving(false);
    }
  };

  // ─── Toggle active ───────────────────────────────────────────────────────

  const handleToggle = async (plan) => {
    try {
      await plansApi.toggle(plan.id);
      toast.success(`Plan ${plan.is_active ? "deactivated" : "activated"}`);
      fetchPlans();
    } catch {
      toast.error("Toggle failed");
    }
  };

  // ─── Toggle featured ─────────────────────────────────────────────────────

  const handleToggleFeatured = async (plan) => {
    try {
      await plansApi.toggleFeatured(plan.id);
      toast.success(`Plan ${plan.is_featured ? "unfeatured" : "featured"}`);
      fetchPlans();
    } catch {
      toast.error("Toggle failed");
    }
  };

  // ─── Form helpers ────────────────────────────────────────────────────────

  const openCreate = () => {
    setFormData(EMPTY);
    setFormErrors({});
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (plan) => {
    setFormData({
      name:           plan.name,
      description:    plan.description ?? "",
      price:          plan.price,
      duration_days:  plan.duration_days,
      daily_earnings: plan.daily_earnings,
      total_return:   plan.total_return,
      features:       plan.features ?? [],
      is_active:      plan.is_active,
      is_featured:    plan.is_featured,
      sort_order:     plan.sort_order,
    });
    setFormErrors({});
    setEditItem(plan);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditItem(null);
    setFormData(EMPTY);
  };

  const set = (key, val) => setFormData((p) => ({ ...p, [key]: val }));

  // ─── Auto-compute total return ───────────────────────────────────────────

  const handleDailyOrDuration = (key, val) => {
    setFormData((p) => {
      const updated = { ...p, [key]: val };
      const daily   = parseFloat(key === "daily_earnings" ? val : p.daily_earnings) || 0;
      const days    = parseFloat(key === "duration_days"  ? val : p.duration_days)  || 0;
      return { ...updated, total_return: (daily * days).toFixed(2) };
    });
  };

  // ─── Table columns ───────────────────────────────────────────────────────

  const columns = [
    {
      key: "plan",
      header: "Plan",
      accessor: "name",
      searchable: true,
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-primary-500 to-primary-700
                          flex items-center justify-center shrink-0 shadow-sm">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold theme-text truncate">{r.name}</p>
              {r.is_featured && (
                <Star className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
            </div>
            <p className="text-xs theme-text-muted truncate max-w-[180px]" title={r.description}>
              {r.description || "No description"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "pricing",
      header: "Price",
      accessor: "price",
      sortable: true,
      render: (r) => (
        <span className="text-sm font-bold text-emerald-400">${Number(r.price).toFixed(2)}</span>
      ),
    },
    {
      key: "stats",
      header: "Returns",
      render: (r) => (
        <div className="flex flex-col gap-1">
          <StatChip
            icon={TrendingUp}
            label="/day"
            value={`$${Number(r.daily_earnings).toFixed(2)}`}
            color="bg-emerald-500/10 text-emerald-400"
          />
          <StatChip
            icon={Zap}
            label="total"
            value={`$${Number(r.total_return).toFixed(2)}`}
            color="bg-primary-500/10 text-primary-400"
          />
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      accessor: "duration_days",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-1.5 text-sm theme-text-secondary">
          <Clock className="w-4 h-4 shrink-0" />
          {r.duration_days} day{r.duration_days !== 1 ? "s" : ""}
        </div>
      ),
    },
    {
      key: "features",
      header: "Features",
      render: (r) => (
        <span className="text-xs theme-text-muted">
          {r.features?.length ?? 0} feature{r.features?.length !== 1 ? "s" : ""}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (r) => (r.is_active ? "Active" : "Inactive"),
      sortable: true,
      render: (r) => (
        <Badge color={r.is_active ? "success" : "default"} dot>
          {r.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "order",
      header: "Order",
      accessor: "sort_order",
      sortable: true,
      render: (r) => (
        <span className="text-xs theme-text-muted font-mono">{r.sort_order}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "200px",
      render: (r) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="xs" icon={Edit2}
            onClick={(e) => { e.stopPropagation(); openEdit(r); }}
          >
            Edit
          </Button>
          <Button
            variant="ghost" size="xs"
            icon={r.is_active ? EyeOff : Eye}
            onClick={(e) => { e.stopPropagation(); handleToggle(r); }}
            title={r.is_active ? "Deactivate" : "Activate"}
          />
          <Button
            variant="ghost" size="xs"
            icon={r.is_featured ? StarOff : Star}
            onClick={(e) => { e.stopPropagation(); handleToggleFeatured(r); }}
            className={r.is_featured ? "text-amber-400" : ""}
            title={r.is_featured ? "Unfeature" : "Feature"}
          />
          <Button
            variant="ghost" size="xs" icon={Trash2}
            className="text-red-400 hover:text-red-300"
            onClick={(e) => { e.stopPropagation(); setDelTarget(r.id); }}
          />
        </div>
      ),
    },
  ];

  const activeCount   = plans.filter((p) => p.is_active).length;
  const featuredCount = plans.filter((p) => p.is_featured).length;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Plans"
        subtitle={`${activeCount} active · ${featuredCount} featured · ${plans.length} total`}
      >
        <Button icon={Plus} onClick={openCreate}>
          New Plan
        </Button>
      </PageHeader>

      {/* Info banner */}
      <div
        className="mb-6 p-4 rounded-xl flex items-start gap-3"
        style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)" }}
      >
        <DollarSign className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
        <p className="text-sm theme-text-secondary">
          Plans are investment / subscription tiers available to users.{" "}
          <strong className="theme-text">Featured</strong> plans are highlighted on the plans page.
          Use <strong className="theme-text">Sort Order</strong> (lower = first) to control display order.
          Deactivated plans are hidden from users.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={plans}
        loading={loading}
        searchPlaceholder="Search plans…"
        pageSize={15}
        emptyTitle="No plans yet"
        emptyDescription="Create your first plan to offer users investment options."
        emptyAction="New Plan"
        onEmptyAction={openCreate}
      />

      {/* ── Create / Edit Modal ── */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editItem ? "Edit Plan" : "Create Plan"}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editItem ? "Save Changes" : "Create Plan"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Name */}
          <FormField label="Plan Name" required error={formErrors.name}>
            <Input
              value={formData.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Gold Plan"
            />
          </FormField>

          {/* Description */}
          <FormField label="Description" error={formErrors.description}>
            <Textarea
              value={formData.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              placeholder="Brief description shown on the plan card…"
            />
          </FormField>

          {/* Price + Duration */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Price (USDT)" required error={formErrors.price}>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="100.00"
              />
            </FormField>
            <FormField label="Duration (days)" required error={formErrors.duration_days}>
              <Input
                type="number"
                min="1"
                value={formData.duration_days}
                onChange={(e) => handleDailyOrDuration("duration_days", e.target.value)}
                placeholder="30"
              />
            </FormField>
          </div>

          {/* Daily earnings + Total return */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Daily Earnings (USDT)"
              required
              error={formErrors.daily_earnings}
              helper="Earnings per day for the user"
            >
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.daily_earnings}
                onChange={(e) => handleDailyOrDuration("daily_earnings", e.target.value)}
                placeholder="5.00"
              />
            </FormField>
            <FormField
              label="Total Return (USDT)"
              required
              error={formErrors.total_return}
              helper="Auto-calculated · editable"
            >
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.total_return}
                onChange={(e) => set("total_return", e.target.value)}
                placeholder="150.00"
              />
            </FormField>
          </div>

          {/* Features */}
          <FormField label="Plan Features" helper="Bullet points shown on the plan card">
            <FeatureTagInput
              features={formData.features}
              onChange={(val) => set("features", val)}
            />
          </FormField>

          {/* Sort order + Toggles */}
          <div className="flex items-center gap-6 flex-wrap">
            <FormField label="Sort Order" helper="Lower = appears first" className="w-32">
              <Input
                type="number"
                min="0"
                value={formData.sort_order}
                onChange={(e) => set("sort_order", e.target.value)}
              />
            </FormField>

            <label className="flex items-center gap-2 cursor-pointer text-sm theme-text-secondary pt-5">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => set("is_active", e.target.checked)}
                className="w-4 h-4 rounded accent-primary-500"
              />
              Active (visible to users)
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-sm theme-text-secondary pt-5">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => set("is_featured", e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500"
              />
              Featured (highlighted)
            </label>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        isOpen={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={handleDelete}
        title="Delete Plan"
        message="This will permanently delete this plan. Users who have subscribed will not be affected, but the plan will no longer be available."
        confirmLabel="Delete"
        danger
        loading={saving}
      />
    </div>
  );
}
