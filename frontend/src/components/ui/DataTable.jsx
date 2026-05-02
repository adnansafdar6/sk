/**
 * DataTable — sortable, searchable, paginated table component.
 */
import { useState, useMemo } from "react";
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import EmptyState from "./EmptyState";

export default function DataTable({
  columns = [],
  data = [],
  searchable = true,
  searchPlaceholder = "Search...",
  pageSize = 10,
  loading = false,
  onRowClick,
  emptyTitle,
  emptyDescription,
  emptyAction,
  onEmptyAction,
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        if (!col.searchable) return false;
        const val = col.accessor ? (typeof col.accessor === "function" ? col.accessor(row) : row[col.accessor]) : "";
        return String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = typeof col.accessor === "function" ? col.accessor(a) : a[col.accessor];
      const bVal = typeof col.accessor === "function" ? col.accessor(b) : b[col.accessor];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir, columns]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="card rounded-2xl overflow-hidden">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-(--bg-input) animate-pulse-soft" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card rounded-2xl overflow-hidden animate-fade-in-up">
      {/* Search */}
      {searchable && (
        <div className="px-5 py-4 border-b theme-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 theme-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={searchPlaceholder}
              className="input-field pl-9"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b theme-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 py-3.5 text-xs font-semibold theme-text-muted uppercase tracking-wider whitespace-nowrap ${
                    col.sortable ? "cursor-pointer select-none hover:theme-text-secondary" : ""
                  }`}
                  onClick={() => col.sortable && handleSort(col.key)}
                  style={col.width ? { width: col.width } : {}}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      sortDir === "asc"
                        ? <ChevronUp className="w-3.5 h-3.5" />
                        : <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-(--border-primary)">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-8">
                  <EmptyState
                    title={emptyTitle || "No results found"}
                    description={emptyDescription || "Try adjusting your search or filters."}
                    actionLabel={emptyAction}
                    onAction={onEmptyAction}
                  />
                </td>
              </tr>
            ) : (
              paginated.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  className={`transition-colors hover:bg-(--bg-card-hover) ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-3.5 whitespace-nowrap">
                      {col.render
                        ? col.render(row)
                        : typeof col.accessor === "function"
                          ? col.accessor(row)
                          : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sorted.length > pageSize && (
        <div className="flex items-center justify-between px-5 py-3.5 border-t theme-border">
          <span className="text-xs theme-text-muted">
            Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <PagBtn onClick={() => setPage(1)} disabled={safePage === 1}>
              <ChevronsLeft className="w-4 h-4" />
            </PagBtn>
            <PagBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
              <ChevronLeft className="w-4 h-4" />
            </PagBtn>
            <span className="px-3 text-xs theme-text-secondary">
              {safePage} / {totalPages}
            </span>
            <PagBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
              <ChevronRight className="w-4 h-4" />
            </PagBtn>
            <PagBtn onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>
              <ChevronsRight className="w-4 h-4" />
            </PagBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function PagBtn({ children, ...props }) {
  return (
    <button
      className="p-1.5 rounded-lg theme-text-muted hover:theme-text hover:bg-(--bg-input) transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      {...props}
    >
      {children}
    </button>
  );
}
