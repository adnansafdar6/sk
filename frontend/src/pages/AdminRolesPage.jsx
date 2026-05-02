/**
 * AdminRolesPage — manage roles and permission matrix.
 */
import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axiosInstance";
import DataTable from "../components/ui/DataTable";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import FormField, { Input, Textarea } from "../components/ui/FormField";

// Forced HMR reload
export default function AdminRolesPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);

  // Modals for Role
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", is_default: false });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        axiosInstance.get("/rbac/roles/"),
        axiosInstance.get("/rbac/permissions/"),
      ]);
      setRoles(rolesRes.data.results || rolesRes.data);
      setPermissions(permsRes.data.results || permsRes.data);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchRoleDetail = async (roleId) => {
    try {
      const res = await axiosInstance.get(`/rbac/roles/${roleId}/`);
      setSelectedRole(res.data);
    } catch {
      toast.error("Failed to load role details");
    }
  };

  // ─── Create Role ───
  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Role name is required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await axiosInstance.post("/rbac/roles/", formData);
      toast.success("Role created successfully");
      setShowCreate(false);
      setFormData({ name: "", description: "", is_default: false });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || "Failed to create role");
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete Role ───
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await axiosInstance.delete(`/rbac/roles/${deleteTarget}/`);
      toast.success("Role deleted");
      if (selectedRole?.id === deleteTarget) setSelectedRole(null);
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast.error("Failed to delete role");
    } finally {
      setSaving(false);
    }
  };

  // ─── Toggle Permission on Role ───
  const handleTogglePermission = async (permId, hasIt) => {
    if (!selectedRole) return;
    const endpoint = hasIt ? "remove-permissions" : "add-permissions";
    try {
      await axiosInstance.post(`/rbac/roles/${selectedRole.id}/${endpoint}/`, {
        permission_ids: [permId],
      });
      toast.success(`Permission ${hasIt ? "removed" : "added"}`);
      fetchRoleDetail(selectedRole.id);
    } catch {
      toast.error("Failed to update permission");
    }
  };

  // ─── Columns ───
  const roleColumns = [
    {
      key: "name",
      header: "Role Name",
      accessor: "name",
      searchable: true,
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold theme-text capitalize">{r.name}</span>
          {r.is_default && <Badge color="success" size="sm">Default</Badge>}
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      accessor: "description",
      searchable: true,
      render: (r) => (
        <span className="text-sm theme-text-secondary line-clamp-1">
          {r.description || "No description"}
        </span>
      ),
    },
    {
      key: "permissions",
      header: "Permissions",
      accessor: (r) => r.permissions_count,
      sortable: true,
      render: (r) => (
        <Badge color="info" size="sm">{r.permissions_count} permissions</Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "80px",
      render: (r) => (
        <Button
          variant="ghost"
          size="xs"
          icon={Trash2}
          onClick={(e) => { e.stopPropagation(); setDeleteTarget(r.id); }}
          className="text-red-400 hover:text-red-300"
        />
      ),
    },
  ];

  // Group permissions by category for the matrix
  const permsByCategory = permissions.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Roles"
        subtitle={`${roles.length} role${roles.length !== 1 ? "s" : ""} configured`}
      >
        <Button icon={Plus} onClick={() => setShowCreate(true)}>
          Create Role
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6">
        {/* Roles Table */}
        <div>
          <DataTable
            columns={roleColumns}
            data={roles}
            loading={loading}
            searchPlaceholder="Search roles..."
            pageSize={10}
            onRowClick={(r) => fetchRoleDetail(r.id)}
            emptyTitle="No roles yet"
            emptyAction="Create Role"
            onEmptyAction={() => setShowCreate(true)}
          />
        </div>

        {/* Permission Matrix */}
        <div>
          {selectedRole ? (
            <div className="card rounded-2xl overflow-hidden animate-fade-in-up">
              <div className="flex items-center justify-between px-6 py-4 border-b theme-border">
                <div>
                  <h2 className="text-lg font-bold theme-text capitalize">
                    {selectedRole.name}
                  </h2>
                  <p className="text-sm theme-text-muted mt-0.5">
                    {selectedRole.description || "No description"}
                  </p>
                </div>
                <Button variant="ghost" size="xs" icon={Trash2} onClick={() => setDeleteTarget(selectedRole.id)} className="text-red-400">
                  Delete
                </Button>
              </div>

              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {Object.entries(permsByCategory).map(([category, perms]) => (
                  <div key={category}>
                    <h4 className="text-xs font-semibold theme-text-muted uppercase tracking-wider mb-3">
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {perms.map((perm) => {
                        const hasIt = selectedRole.permissions?.some((p) => p.id === perm.id);
                        return (
                          <button
                            key={perm.id}
                            onClick={() => handleTogglePermission(perm.id, hasIt)}
                            className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                              hasIt
                                ? "bg-primary-600/10 border border-primary-500/25"
                                : "bg-(--bg-input) border theme-border hover:border-(--border-hover)"
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs shrink-0 ${hasIt ? "bg-primary-500 text-white" : "bg-(--bg-input) border theme-border"}`}>
                              {hasIt && "✓"}
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${hasIt ? "text-primary-400" : "theme-text-secondary"}`}>{perm.name}</p>
                              <p className="text-xs theme-text-muted">{perm.codename}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {Object.keys(permsByCategory).length === 0 && (
                  <p className="text-sm theme-text-muted text-center py-8">No permissions available.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="card rounded-2xl p-12 text-center animate-fade-in-up">
              <p className="theme-text-muted">Select a role to view and manage its permissions</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Role Modals ─── */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Role" size="sm" footer={
        <>
          <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button onClick={handleCreate} loading={saving}>Create Role</Button>
        </>
      }>
        <div className="space-y-4">
          <FormField label="Role Name" required error={formErrors.name}>
            <Input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. editor" />
          </FormField>
          <FormField label="Description">
            <Textarea value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} rows={3} placeholder="What does this role do?" />
          </FormField>
          <label className="flex items-center gap-2 cursor-pointer text-sm theme-text-secondary">
            <input type="checkbox" checked={formData.is_default} onChange={(e) => setFormData((p) => ({ ...p, is_default: e.target.checked }))} className="w-4 h-4 rounded accent-primary-500" />
            Auto-assign to new users
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Role" message="This will permanently delete the role and remove it from all users. This cannot be undone."
        confirmLabel="Delete Role" danger loading={saving}
      />
    </div>
  );
}
