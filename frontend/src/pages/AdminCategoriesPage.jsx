/**
 * AdminCategoriesPage — CRUD categories with tree structure.
 */
import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { categoryApi } from "../api/categoryApi";
import DataTable from "../components/ui/DataTable";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import FormField, { Input, Textarea, Select } from "../components/ui/FormField";

const EMPTY = { name: "", slug: "", description: "", parent: "", is_active: true };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState(EMPTY);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await categoryApi.list();
      const allCats = res.data.results || res.data;
      // Only process root categories so we don't double-count children
      const roots = allCats.filter((c) => !c.parent);
      const flat = flattenCategories(roots);
      setCategories(flat);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Flatten nested categories for a flat table
  function flattenCategories(cats, depth = 0, parentName = null) {
    const result = [];
    for (const cat of cats) {
      result.push({ ...cat, _depth: depth, _parentName: parentName });
      if (cat.subcategories?.length) {
        result.push(...flattenCategories(cat.subcategories, depth + 1, cat.name));
      }
    }
    return result;
  }

  // Get root categories (for parent dropdown)
  const rootCategories = categories.filter((c) => !c.parent);

  // Auto-generate slug from name
  const autoSlug = (name) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  // ─── Validation ───
  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Name is required";
    if (!formData.slug.trim()) errs.slug = "Slug is required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Create / Edit ───
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...formData };
      if (!payload.parent) payload.parent = null;

      if (editCat) {
        await categoryApi.update(editCat.id, payload);
        toast.success("Category updated");
      } else {
        await categoryApi.create(payload);
        toast.success("Category created");
      }
      closeForm();
      fetchData();
    } catch (err) {
      const d = err.response?.data;
      if (d && typeof d === "object") {
        const firstErr = Object.values(d).flat()[0];
        toast.error(firstErr || "Operation failed");
      } else {
        toast.error("Operation failed");
      }
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ───
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await categoryApi.delete(deleteTarget);
      toast.success("Category deleted");
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setSaving(false);
    }
  };

  // ─── Toggle Active ───
  const handleToggleActive = async (cat) => {
    try {
      await categoryApi.update(cat.id, { is_active: !cat.is_active });
      toast.success(`Category ${!cat.is_active ? "activated" : "deactivated"}`);
      fetchData();
    } catch {
      toast.error("Toggle failed");
    }
  };

  // ─── Open Form ───
  const openCreate = () => {
    setFormData(EMPTY);
    setFormErrors({});
    setEditCat(null);
    setShowForm(true);
  };

  const openEdit = (cat) => {
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      parent: cat.parent || "",
      is_active: cat.is_active,
    });
    setFormErrors({});
    setEditCat(cat);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditCat(null);
    setFormData(EMPTY);
  };

  // ─── Table Columns ───
  const columns = [
    {
      key: "name",
      header: "Name",
      accessor: "name",
      searchable: true,
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2">
          {r._depth > 0 && (
            <span className="theme-text-muted" style={{ paddingLeft: r._depth * 16 }}>
              └
            </span>
          )}
          <span className="text-sm font-medium theme-text">{r.name}</span>
        </div>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      accessor: "slug",
      searchable: true,
      render: (r) => (
        <span className="text-xs theme-text-muted font-mono">{r.slug}</span>
      ),
    },
    {
      key: "parent",
      header: "Parent",
      accessor: (r) => r.parent_name || "—",
      sortable: true,
      render: (r) => (
        <span className="text-sm theme-text-secondary">
          {r.parent_name || "Root"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (r) => r.is_active ? "Active" : "Inactive",
      sortable: true,
      render: (r) => (
        <Badge color={r.is_active ? "success" : "danger"} dot>
          {r.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "children",
      header: "Children",
      accessor: (r) => r.subcategories?.length || 0,
      render: (r) => (
        <span className="text-xs theme-text-muted">
          {r.subcategories?.length || 0}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "160px",
      render: (r) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="xs" icon={Edit2} onClick={(e) => { e.stopPropagation(); openEdit(r); }}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="xs"
            icon={r.is_active ? EyeOff : Eye}
            onClick={(e) => { e.stopPropagation(); handleToggleActive(r); }}
          />
          <Button
            variant="ghost"
            size="xs"
            icon={Trash2}
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(r.id); }}
            className="text-red-400 hover:text-red-300"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Categories"
        subtitle={`${categories.length} categor${categories.length !== 1 ? "ies" : "y"} total`}
      >
        <Button icon={Plus} onClick={openCreate}>
          Add Category
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={categories}
        loading={loading}
        searchPlaceholder="Search categories..."
        pageSize={15}
        emptyTitle="No categories yet"
        emptyDescription="Create a category to organize your content."
        emptyAction="Add Category"
        onEmptyAction={openCreate}
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editCat ? "Edit Category" : "Create Category"}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editCat ? "Save Changes" : "Create Category"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Name" required error={formErrors.name}>
            <Input
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value;
                setFormData((p) => ({
                  ...p,
                  name,
                  slug: editCat ? p.slug : autoSlug(name),
                }));
              }}
              placeholder="e.g. Electronics"
            />
          </FormField>
          <FormField label="Slug" required error={formErrors.slug} helper="URL-friendly identifier">
            <Input
              value={formData.slug}
              onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
              placeholder="electronics"
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="Brief description..."
            />
          </FormField>
          <FormField label="Parent Category">
            <Select
              value={formData.parent}
              onChange={(e) => setFormData((p) => ({ ...p, parent: e.target.value }))}
            >
              <option value="">None (root category)</option>
              {rootCategories
                .filter((c) => c.id !== editCat?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </Select>
          </FormField>
          <label className="flex items-center gap-2 cursor-pointer text-sm theme-text-secondary">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))}
              className="w-4 h-4 rounded accent-primary-500"
            />
            Active
          </label>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message="This will permanently delete this category and all its subcategories."
        confirmLabel="Delete"
        danger
        loading={saving}
      />
    </div>
  );
}
