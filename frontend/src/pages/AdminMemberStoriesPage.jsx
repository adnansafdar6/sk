/**
 * AdminMemberStoriesPage — CRUD for landing-page testimonial cards.
 */
import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff, Quote, Star } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axiosInstance";
import DataTable from "../components/ui/DataTable";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import FormField, { Input, Textarea, Select } from "../components/ui/FormField";

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_OPTIONS = [
  { value: "from-violet-500 to-violet-700",  label: "Violet" },
  { value: "from-emerald-500 to-emerald-700", label: "Emerald" },
  { value: "from-pink-500 to-pink-700",       label: "Pink" },
  { value: "from-amber-500 to-amber-700",     label: "Amber" },
  { value: "from-cyan-500 to-cyan-700",       label: "Cyan" },
  { value: "from-rose-500 to-rose-700",       label: "Rose" },
  { value: "from-blue-500 to-blue-700",       label: "Blue" },
  { value: "from-indigo-500 to-indigo-700",   label: "Indigo" },
  { value: "from-teal-500 to-teal-700",       label: "Teal" },
  { value: "from-orange-500 to-orange-700",   label: "Orange" },
];

const EMPTY = {
  name: "",
  avatar_initials: "",
  avatar_color: "from-violet-500 to-violet-700",
  earned_amount: "",
  months_active: 1,
  quote: "",
  is_active: true,
  sort_order: 0,
};

// ─── Avatar Preview ───────────────────────────────────────────────────────────

function AvatarPreview({ initials, color }) {
  return (
    <div
      className={`w-9 h-9 rounded-xl bg-linear-to-br ${color} flex items-center justify-center shrink-0`}
    >
      <span className="text-white font-bold text-sm">{initials || "??"}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminMemberStoriesPage() {
  const [stories,  setStories]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [formData, setFormData] = useState(EMPTY);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // ─── Fetch ───

  const fetchData = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/wallet/admin/member-stories/");
      setStories(res.data.results ?? res.data);
    } catch {
      toast.error("Failed to load member stories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Validation ───

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Name is required";
    if (!formData.avatar_initials.trim()) errs.avatar_initials = "Initials are required";
    if (!formData.earned_amount.trim()) errs.earned_amount = "Earned amount is required";
    if (!formData.quote.trim()) errs.quote = "Quote is required";
    if (Number(formData.months_active) < 1) errs.months_active = "Must be at least 1";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Save (Create / Edit) ───

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...formData,
        months_active: Number(formData.months_active),
        sort_order: Number(formData.sort_order),
      };
      if (editItem) {
        await axiosInstance.patch(`/wallet/admin/member-stories/${editItem.id}/`, payload);
        toast.success("Story updated");
      } else {
        await axiosInstance.post("/wallet/admin/member-stories/", payload);
        toast.success("Story created");
      }
      closeForm();
      fetchData();
    } catch (err) {
      const d = err.response?.data;
      if (d && typeof d === "object") {
        const first = Object.values(d).flat()[0];
        toast.error(first || "Operation failed");
      } else {
        toast.error("Operation failed");
      }
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ───

  const handleDelete = async () => {
    if (!delTarget) return;
    setSaving(true);
    try {
      await axiosInstance.delete(`/wallet/admin/member-stories/${delTarget}/`);
      toast.success("Story deleted");
      setDelTarget(null);
      fetchData();
    } catch {
      toast.error("Failed to delete story");
    } finally {
      setSaving(false);
    }
  };

  // ─── Toggle ───

  const handleToggle = async (story) => {
    try {
      await axiosInstance.post(`/wallet/admin/member-stories/${story.id}/toggle/`);
      toast.success(`Story ${story.is_active ? "hidden" : "shown"}`);
      fetchData();
    } catch {
      toast.error("Toggle failed");
    }
  };

  // ─── Form helpers ───

  const openCreate = () => {
    setFormData(EMPTY);
    setFormErrors({});
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (story) => {
    setFormData({
      name:            story.name,
      avatar_initials: story.avatar_initials,
      avatar_color:    story.avatar_color,
      earned_amount:   story.earned_amount,
      months_active:   story.months_active,
      quote:           story.quote,
      is_active:       story.is_active,
      sort_order:      story.sort_order,
    });
    setFormErrors({});
    setEditItem(story);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditItem(null);
    setFormData(EMPTY);
  };

  const set = (key, val) => setFormData((p) => ({ ...p, [key]: val }));

  // ─── Auto-fill initials from name ───

  const handleNameChange = (e) => {
    const name = e.target.value;
    const auto = name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
    setFormData((p) => ({
      ...p,
      name,
      avatar_initials: editItem ? p.avatar_initials : auto,
    }));
  };

  // ─── Table columns ───

  const columns = [
    {
      key: "member",
      header: "Member",
      accessor: "name",
      searchable: true,
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <AvatarPreview initials={r.avatar_initials} color={r.avatar_color} />
          <div>
            <p className="text-sm font-medium theme-text">{r.name}</p>
            <p className="text-xs theme-text-muted">{r.months_active} month{r.months_active !== 1 ? "s" : ""} active</p>
          </div>
        </div>
      ),
    },
    {
      key: "earned",
      header: "Earned",
      accessor: "earned_amount",
      sortable: true,
      render: (r) => (
        <span className="text-sm font-semibold text-emerald-400">{r.earned_amount}</span>
      ),
    },
    {
      key: "quote",
      header: "Quote",
      accessor: "quote",
      searchable: true,
      render: (r) => (
        <p className="text-xs theme-text-secondary max-w-xs truncate" title={r.quote}>
          <Quote className="w-3 h-3 inline mr-1 opacity-50" />
          {r.quote}
        </p>
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
      key: "status",
      header: "Status",
      accessor: (r) => (r.is_active ? "Active" : "Hidden"),
      sortable: true,
      render: (r) => (
        <Badge color={r.is_active ? "success" : "default"} dot>
          {r.is_active ? "Visible" : "Hidden"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "160px",
      render: (r) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="xs" icon={Edit2}
            onClick={(e) => { e.stopPropagation(); openEdit(r); }}>
            Edit
          </Button>
          <Button variant="ghost" size="xs"
            icon={r.is_active ? EyeOff : Eye}
            onClick={(e) => { e.stopPropagation(); handleToggle(r); }}
            title={r.is_active ? "Hide" : "Show"}
          />
          <Button variant="ghost" size="xs" icon={Trash2}
            className="text-red-400 hover:text-red-300"
            onClick={(e) => { e.stopPropagation(); setDelTarget(r.id); }}
          />
        </div>
      ),
    },
  ];

  const activeCount = stories.filter((s) => s.is_active).length;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Member Stories"
        subtitle={`${activeCount} visible · ${stories.length} total`}
      >
        <Button icon={Plus} onClick={openCreate}>
          Add Story
        </Button>
      </PageHeader>

      {/* Info banner */}
      <div className="mb-6 p-4 rounded-xl flex items-start gap-3"
           style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)" }}>
        <Star className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
        <p className="text-sm theme-text-secondary">
          Stories shown here appear in the <strong className="theme-text">"What our members say"</strong> section
          on the public landing page. Only <strong className="theme-text">visible</strong> stories are displayed.
          Use <strong className="theme-text">Sort Order</strong> (lower = first) to control the display sequence.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={stories}
        loading={loading}
        searchPlaceholder="Search by name or quote…"
        pageSize={15}
        emptyTitle="No member stories yet"
        emptyDescription="Add testimonials to build social proof on your landing page."
        emptyAction="Add Story"
        onEmptyAction={openCreate}
      />

      {/* ── Create / Edit Modal ── */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editItem ? "Edit Member Story" : "Add Member Story"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editItem ? "Save Changes" : "Create Story"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Name + Avatar preview row */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-2 pt-6">
              <AvatarPreview
                initials={formData.avatar_initials || "??"}
                color={formData.avatar_color}
              />
              <span className="text-[10px] theme-text-muted">Preview</span>
            </div>
            <div className="flex-1 space-y-4">
              <FormField label="Display Name" required error={formErrors.name}>
                <Input
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g. Sarah K."
                />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Avatar Initials" required error={formErrors.avatar_initials}
                  helper="2–4 letters">
                  <Input
                    value={formData.avatar_initials}
                    onChange={(e) => set("avatar_initials", e.target.value.toUpperCase().slice(0, 4))}
                    placeholder="SK"
                    maxLength={4}
                  />
                </FormField>
                <FormField label="Avatar Color">
                  <Select
                    value={formData.avatar_color}
                    onChange={(e) => set("avatar_color", e.target.value)}
                  >
                    {COLOR_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </Select>
                </FormField>
              </div>
            </div>
          </div>

          {/* Earned + Months */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Earned Amount" required error={formErrors.earned_amount}
              helper='Display string, e.g. "$420"'>
              <Input
                value={formData.earned_amount}
                onChange={(e) => set("earned_amount", e.target.value)}
                placeholder="$420"
              />
            </FormField>
            <FormField label="Months Active" required error={formErrors.months_active}>
              <Input
                type="number"
                min={1}
                value={formData.months_active}
                onChange={(e) => set("months_active", e.target.value)}
              />
            </FormField>
          </div>

          {/* Quote */}
          <FormField label="Testimonial Quote" required error={formErrors.quote}>
            <Textarea
              value={formData.quote}
              onChange={(e) => set("quote", e.target.value)}
              rows={3}
              placeholder="What did this member say about the platform?"
            />
          </FormField>

          {/* Sort order + Active */}
          <div className="flex items-center gap-6">
            <FormField label="Sort Order" helper="Lower = appears first" className="w-32">
              <Input
                type="number"
                min={0}
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
              Visible on landing page
            </label>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        isOpen={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={handleDelete}
        title="Delete Member Story"
        message="This will permanently delete this testimonial from the landing page."
        confirmLabel="Delete"
        danger
        loading={saving}
      />
    </div>
  );
}
