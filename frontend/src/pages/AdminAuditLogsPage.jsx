/**
 * AdminAuditLogsPage — filterable audit log viewer with detail panel.
 */
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axiosInstance";
import DataTable from "../components/ui/DataTable";
import PageHeader from "../components/ui/PageHeader";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

const actionColors = {
  LOGIN: "success",
  LOGOUT: "info",
  FAILED_LOGIN: "danger",
  CREATE: "primary",
  UPDATE: "warning",
  DELETE: "danger",
  PASSWORD_RESET: "warning",
  OTHER: "neutral",
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/audit/logs/");
      setLogs(res.data.results || res.data);
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const columns = [
    {
      key: "action",
      header: "Action",
      accessor: "action",
      searchable: true,
      sortable: true,
      render: (r) => (
        <Badge color={actionColors[r.action] || "neutral"} size="sm">
          {r.action}
        </Badge>
      ),
    },
    {
      key: "actor",
      header: "Actor",
      accessor: (r) => r.actor_details?.email || "System",
      searchable: true,
      sortable: true,
      render: (r) => (
        <div>
          <p className="text-sm theme-text">
            {r.actor_details ? `${r.actor_details.first_name} ${r.actor_details.last_name}` : "System"}
          </p>
          <p className="text-xs theme-text-muted">
            {r.actor_details?.email || "Automated"}
          </p>
        </div>
      ),
    },
    {
      key: "target",
      header: "Target",
      accessor: "object_repr",
      searchable: true,
      render: (r) => (
        <span className="text-sm theme-text-secondary truncate max-w-[200px] block">
          {r.object_repr || "System event"}
        </span>
      ),
    },
    {
      key: "ip",
      header: "IP Address",
      accessor: "ip_address",
      searchable: true,
      render: (r) => (
        <span className="text-xs theme-text-muted font-mono">
          {r.ip_address || "—"}
        </span>
      ),
    },
    {
      key: "timestamp",
      header: "Timestamp",
      accessor: "timestamp",
      sortable: true,
      render: (r) => (
        <span className="text-xs theme-text-secondary whitespace-nowrap">
          {new Date(r.timestamp).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Audit Logs"
        subtitle="Monitor system events, authentications, and data changes"
      />

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        searchPlaceholder="Search by action, actor, target, or IP..."
        pageSize={15}
        onRowClick={(row) => setSelectedLog(row)}
        emptyTitle="No audit logs"
        emptyDescription="Activity will appear here as users interact with the system."
      />

      {/* Log Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Detail"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <InfoBlock label="Action">
                <Badge color={actionColors[selectedLog.action] || "neutral"}>
                  {selectedLog.action}
                </Badge>
              </InfoBlock>
              <InfoBlock label="Timestamp">
                {new Date(selectedLog.timestamp).toLocaleString()}
              </InfoBlock>
              <InfoBlock label="Actor">
                {selectedLog.actor_details
                  ? `${selectedLog.actor_details.first_name} ${selectedLog.actor_details.last_name} (${selectedLog.actor_details.email})`
                  : "System / Anonymous"}
              </InfoBlock>
              <InfoBlock label="IP Address">
                <span className="font-mono">{selectedLog.ip_address || "N/A"}</span>
              </InfoBlock>
              <InfoBlock label="Target Object" full>
                {selectedLog.object_repr || "N/A"}
              </InfoBlock>
            </div>

            <div>
              <p className="text-xs font-semibold theme-text-muted uppercase tracking-wider mb-2">
                Changes / Payload
              </p>
              <div className="bg-(--bg-input) p-4 rounded-xl overflow-x-auto border theme-border">
                <pre className="text-xs font-mono text-primary-400 whitespace-pre-wrap">
                  {JSON.stringify(selectedLog.changes, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function InfoBlock({ label, children, full = false }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <p className="text-xs font-semibold theme-text-muted uppercase tracking-wider mb-1">
        {label}
      </p>
      <div className="text-sm theme-text">{children}</div>
    </div>
  );
}
