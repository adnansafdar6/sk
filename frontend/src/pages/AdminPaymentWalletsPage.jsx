/**
 * AdminPaymentWalletsPage — CRUD for USDT deposit wallet addresses.
 * These addresses are shown to users on the plan payment page.
 */
import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff, Copy, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import paymentWalletsApi from "../api/paymentWalletsApi";
import DataTable from "../components/ui/DataTable";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import FormField, { Input, Select } from "../components/ui/FormField";

// ─── Constants ────────────────────────────────────────────────────────────────

const NETWORK_OPTIONS = [
  { value: "USDT_TRC20", label: "USDT — TRC20 (Tron)"      },
  { value: "USDT_ERC20", label: "USDT — ERC20 (Ethereum)"  },
  { value: "USDT_BEP20", label: "USDT — BEP20 (BSC)"       },
];

const NETWORK_BADGES = {
  USDT_TRC20: { color: "warning", label: "TRC20" },
  USDT_ERC20: { color: "primary", label: "ERC20" },
  USDT_BEP20: { color: "success", label: "BEP20" },
};

const EMPTY = { label: "", network: "USDT_TRC20", address: "", is_active: true, sort_order: 0 };

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminPaymentWalletsPage() {
  const [wallets,    setWallets]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [delTarget,  setDelTarget]  = useState(null);
  const [formData,   setFormData]   = useState(EMPTY);
  const [formErrors, setFormErrors] = useState({});
  const [saving,     setSaving]     = useState(false);

  // ─── Fetch ───

  const fetchWallets = useCallback(async () => {
    try {
      const res = await paymentWalletsApi.list();
      setWallets(res.data.results ?? res.data);
    } catch {
      toast.error("Failed to load payment wallets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWallets(); }, [fetchWallets]);

  // ─── Validation ───

  const validate = () => {
    const errs = {};
    if (!formData.label.trim())   errs.label   = "Label is required";
    if (!formData.address.trim()) errs.address  = "Wallet address is required";
    if (formData.address.trim().length < 10) errs.address = "Enter a valid wallet address";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Save ───

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...formData, sort_order: Number(formData.sort_order) };
      if (editItem) {
        await paymentWalletsApi.update(editItem.id, payload);
        toast.success("Wallet updated");
      } else {
        await paymentWalletsApi.create(payload);
        toast.success("Wallet added");
      }
      closeForm();
      fetchWallets();
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

  // ─── Delete ───

  const handleDelete = async () => {
    if (!delTarget) return;
    setSaving(true);
    try {
      await paymentWalletsApi.remove(delTarget);
      toast.success("Wallet deleted");
      setDelTarget(null);
      fetchWallets();
    } catch {
      toast.error("Failed to delete wallet");
    } finally {
      setSaving(false);
    }
  };

  // ─── Toggle ───

  const handleToggle = async (wallet) => {
    try {
      await paymentWalletsApi.toggle(wallet.id);
      toast.success(`Wallet ${wallet.is_active ? "hidden" : "activated"}`);
      fetchWallets();
    } catch {
      toast.error("Toggle failed");
    }
  };

  // ─── Copy address ───

  const copyAddress = (address) => {
    navigator.clipboard.writeText(address).then(() => toast.success("Address copied"));
  };

  // ─── Form helpers ───

  const openCreate = () => {
    setFormData(EMPTY);
    setFormErrors({});
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (w) => {
    setFormData({
      label:      w.label,
      network:    w.network,
      address:    w.address,
      is_active:  w.is_active,
      sort_order: w.sort_order,
    });
    setFormErrors({});
    setEditItem(w);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditItem(null); setFormData(EMPTY); };
  const set = (k, v) => setFormData((p) => ({ ...p, [k]: v }));

  // ─── Table columns ───

  const columns = [
    {
      key: "wallet",
      header: "Wallet",
      accessor: "label",
      searchable: true,
      sortable: true,
      render: (r) => {
        const badge = NETWORK_BADGES[r.network] ?? { color: "default", label: r.network };
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold theme-text">{r.label}</p>
              <Badge color={badge.color} size="xs">{badge.label}</Badge>
            </div>
          </div>
        );
      },
    },
    {
      key: "address",
      header: "Address",
      accessor: "address",
      searchable: true,
      render: (r) => (
        <div className="flex items-center gap-2 max-w-xs">
          <span className="text-xs font-mono theme-text-secondary truncate" title={r.address}>
            {r.address}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); copyAddress(r.address); }}
            className="shrink-0 p-1 rounded hover:bg-(--bg-input) transition-colors cursor-pointer"
            title="Copy address"
          >
            <Copy className="w-3.5 h-3.5 theme-text-muted" />
          </button>
        </div>
      ),
    },
    {
      key: "network",
      header: "Network",
      accessor: "network_display",
      sortable: true,
      render: (r) => (
        <span className="text-sm theme-text-secondary">{r.network_display}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (r) => (r.is_active ? "Active" : "Hidden"),
      sortable: true,
      render: (r) => (
        <Badge color={r.is_active ? "success" : "default"} dot>
          {r.is_active ? "Active" : "Hidden"}
        </Badge>
      ),
    },
    {
      key: "order",
      header: "Order",
      accessor: "sort_order",
      sortable: true,
      render: (r) => <span className="text-xs font-mono theme-text-muted">{r.sort_order}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      width: "150px",
      render: (r) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="xs" icon={Edit2}
            onClick={(e) => { e.stopPropagation(); openEdit(r); }}>
            Edit
          </Button>
          <Button variant="ghost" size="xs"
            icon={r.is_active ? EyeOff : Eye}
            onClick={(e) => { e.stopPropagation(); handleToggle(r); }}
            title={r.is_active ? "Deactivate" : "Activate"}
          />
          <Button variant="ghost" size="xs" icon={Trash2}
            className="text-red-400 hover:text-red-300"
            onClick={(e) => { e.stopPropagation(); setDelTarget(r.id); }}
          />
        </div>
      ),
    },
  ];

  const activeCount = wallets.filter((w) => w.is_active).length;

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Payment Wallets"
        subtitle={`${activeCount} active · ${wallets.length} total — shown on customer payment page`}
      >
        <Button icon={Plus} onClick={openCreate}>
          Add Wallet
        </Button>
      </PageHeader>

      {/* Info banner */}
      <div className="mb-6 p-4 rounded-xl flex items-start gap-3"
           style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)" }}>
        <Wallet className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
        <p className="text-sm theme-text-secondary">
          These wallet addresses are shown to users on the <strong className="theme-text">Plan Payment</strong> page.
          Only <strong className="theme-text">active</strong> wallets are displayed.
          Use <strong className="theme-text">Sort Order</strong> (lower = first) to control which address appears first.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={wallets}
        loading={loading}
        searchPlaceholder="Search by label or address…"
        pageSize={20}
        emptyTitle="No payment wallets yet"
        emptyDescription="Add at least one USDT wallet address so users can send plan payments."
        emptyAction="Add Wallet"
        onEmptyAction={openCreate}
      />

      {/* ── Create / Edit Modal ── */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editItem ? "Edit Payment Wallet" : "Add Payment Wallet"}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editItem ? "Save Changes" : "Add Wallet"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Label" required error={formErrors.label}
            helper='Shown above the address, e.g. "Main Deposit Wallet"'>
            <Input
              value={formData.label}
              onChange={(e) => set("label", e.target.value)}
              placeholder="Main Deposit Wallet"
            />
          </FormField>

          <FormField label="Network" required>
            <Select value={formData.network} onChange={(e) => set("network", e.target.value)}>
              {NETWORK_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Wallet Address" required error={formErrors.address}
            helper="The full crypto address where users will send their payment">
            <Input
              value={formData.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb"
              className="font-mono text-sm"
            />
          </FormField>

          <div className="flex items-center gap-6">
            <FormField label="Sort Order" helper="Lower = shown first" className="w-32">
              <Input type="number" min="0"
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
              Active (show on payment page)
            </label>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        isOpen={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={handleDelete}
        title="Delete Payment Wallet"
        message="This wallet address will be removed from the payment page. Users currently on the payment page may lose access to this address."
        confirmLabel="Delete"
        danger
        loading={saving}
      />
    </div>
  );
}
