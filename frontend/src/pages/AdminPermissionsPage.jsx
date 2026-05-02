/**
 * AdminPermissionsPage — manage system-wide permissions.
 */
import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axiosInstance";
import DataTable from "../components/ui/DataTable";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import FormField, { Input } from "../components/ui/FormField";

const EMPTY = { name: "", codename: "", category: "" };

export default function AdminPermissionsPage() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editPerm, setEditPerm] = useState(null);
  const [formData, setFormData] = useState(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/rbac/permissions/");
      setPermissions(res.data.results || res.data);
    } catch {
      toast.error("Failed to load permissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.codename.trim() || !formData.category.trim()) {
      toast.error("All fields are required");
      return;
    }
    setSaving(true);
    try {
      if (editPerm) {
        await axiosInstance.patch(`/rbac/permissions/${editPerm.id}/`, formData);
        toast.success("Permission updated");
      } else {
        await axiosInstance.post("/rbac/permissions/", formData);
        toast.success("Permission created");
      }
      closeForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || err.response?.data?.codename?.[0] || "Failed to save permission");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await axiosInstance.delete(`/rbac/permissions/${deleteTarget}/`);
      toast.success("Permission deleted");
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast.error("Failed to delete permission");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (p) => {
    setFormData({ name: p.name, codename: p.codename, category: p.category });
    setEditPerm(p);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditPerm(null);
    setFormData(EMPTY);
  };

  const columns = [
    { key: "name", header: "Name", accessor: "name", searchable: true, sortable: true },
    { key: "codename", header: "Codename", accessor: "codename", searchable: true },
    { key: "category", header: "Category", accessor: "category", searchable: true, sortable: true, render: (r) => <Badge size="sm" color="neutral">{r.category}</Badge> },
    {
      key: "actions", header: "Actions", width: "100px", render: (r) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="xs" icon={Edit2} onClick={() => openEdit(r)} />
          <Button variant="ghost" size="xs" icon={Trash2} onClick={() => setDeleteTarget(r.id)} className="text-red-400 hover:text-red-300" />
        </div>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Permissions"
        subtitle={`${permissions.length} system permission${permissions.length !== 1 ? "s" : ""}`}
      >
        <Button icon={Plus} onClick={() => setShowForm(true)}>
          Create Permission
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={permissions}
        loading={loading}
        searchPlaceholder="Search permissions..."
        pageSize={15}
        emptyTitle="No permissions found"
        emptyDescription="Add some permissions into the system."
        emptyAction="Create Permission"
        onEmptyAction={() => setShowForm(true)}
      />

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={closeForm} title={editPerm ? "Edit Permission" : "Create Permission"} size="sm" footer={
        <>
          <Button variant="secondary" onClick={closeForm}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{editPerm ? "Save Changes" : "Create Permission"}</Button>
        </>
      }>
        <div className="space-y-4">
          <FormField label="Permission Title" required helper="Readable name like 'Can View Users'">
            <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Can Edit Posts" />
          </FormField>
          <FormField label="Codename" required helper="System identifier like 'view_users'">
            <Input value={formData.codename} onChange={(e) => setFormData(p => ({ ...p, codename: e.target.value }))} placeholder="edit_posts" />
          </FormField>
          <FormField label="Category" required helper="Group permissions together visually">
            <Input value={formData.category} onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Content" />
          </FormField>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Permission" message="Are you sure? Removing a permission will revoke it from all roles currently holding it."
        confirmLabel="Delete Permission" danger loading={saving}
      />
    </div>
  );
}
