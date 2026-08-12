"use client";

import { useMemo, useState, type ReactNode } from "react";
import { IoChevronUp, IoChevronDown, IoSearchOutline } from "react-icons/io5";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  filterValue?: (row: T) => string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  pageSize?: number;
  searchPlaceholder?: string;
  emptyMessage?: string;
  actions?: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
}

type SortDir = "asc" | "desc";

// One shared table: sortable (click a header), filterable (single search box
// matching any column with filterValue), paginated. Falls back to stacked
// cards below the sm breakpoint since a wide table just breaks on mobile —
// Section 12 calls this out explicitly as the hard case to get right.
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  pageSize = 10,
  searchPlaceholder = "Search…",
  emptyMessage = "Nothing here yet.",
  actions,
  onRowClick,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((row) =>
      columns.some((col) => col.filterValue?.(row).toLowerCase().includes(q)),
    );
  }, [rows, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const pageRows = sorted.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);

  function handleSort(col: DataTableColumn<T>) {
    if (!col.sortValue) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.key);
      setSortDir("asc");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {columns.some((c) => c.filterValue) && (
        <div className="relative max-w-[240px]">
          <IoSearchOutline className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={searchPlaceholder}
            className="h-7 w-full rounded-full border border-transparent bg-[#f8f8fa] pl-7 pr-3 text-sm text-foreground placeholder:text-[#9da3af] transition-colors focus-visible:border-primary/40 focus-visible:bg-background focus-visible:outline-none"
          />
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <>
          {/* Table: sm and up */}
          <div className="hidden overflow-x-auto rounded border border-[#e1e1e6] sm:block">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#e1e1e6] bg-[#f2f2f5]">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col)}
                      className={cn(
                        "px-3 py-2 text-left font-medium text-black",
                        col.sortValue && "cursor-pointer select-none",
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.header}
                        {sortKey === col.key && (sortDir === "asc" ? <IoChevronUp size={14} /> : <IoChevronDown size={14} />)}
                      </span>
                    </th>
                  ))}
                  {actions && <th className="px-3 py-2 text-right font-medium text-black">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "border-b border-[#f2f2f2] last:border-0 hover:bg-[#f2f2f5]",
                      onRowClick && "cursor-pointer",
                    )}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-3 py-2 text-foreground">
                        {col.render(row)}
                      </td>
                    ))}
                    {actions && <td className="px-3 py-2 text-right">{actions(row)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stacked cards: below sm */}
          <div className="flex flex-col gap-2 sm:hidden">
            {pageRows.map((row) => (
              <div
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn("rounded border border-border bg-card p-3", onRowClick && "cursor-pointer")}
              >
                {columns.map((col) => (
                  <div key={col.key} className="flex justify-between gap-3 py-0.5 text-sm">
                    <span className="text-muted-foreground">{col.header}</span>
                    <span className="text-right text-foreground">{col.render(row)}</span>
                  </div>
                ))}
                {actions && <div className="mt-2 flex justify-end gap-2">{actions(row)}</div>}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Page {clampedPage} of {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={clampedPage <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="secondary" size="sm" disabled={clampedPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
