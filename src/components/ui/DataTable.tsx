"use client";

import { useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { IoChevronUp, IoChevronDown, IoSearchOutline, IoChevronBack, IoChevronForward } from "react-icons/io5";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { RowContextMenu, type RowMenuAction } from "@/components/ui/RowContextMenu";
import { Skeleton } from "@/components/ui/Skeleton";

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
  /** Also doubles as the row's "View" action — fires on row click (but not on
   * a click that originated from an interactive element inside the row). */
  onRowClick?: (row: T) => void;
  /** Right-click context menu items for a row, reusing the same handlers as
   * the `actions` buttons. Return an empty array (or omit the prop) to let
   * the browser's native context menu show instead. */
  rowMenuActions?: (row: T) => RowMenuAction[];
  /** Small header line in the context menu identifying which row it applies to. */
  getRowLabel?: (row: T) => string;
  /** Extra controls (e.g. sort/status filters) rendered alongside the search box. */
  toolbarExtra?: ReactNode;
  /** True while `rows` is still loading — renders a shimmering skeleton with
   * this table's own columns/toolbar instead of the (currently empty) rows,
   * so the loading state matches the real layout instead of a generic spinner. */
  loading?: boolean;
  /** Number of skeleton rows to show while `loading`. Defaults to a small
   * fixed count rather than `pageSize` so a page-size-10 table doesn't render
   * an oversized skeleton before it knows how many rows it'll actually have. */
  skeletonRows?: number;
}

// Cycled per cell so skeleton bars read as varied text lengths rather than a
// uniform grid of identical rectangles.
const SKELETON_WIDTHS = ["w-4/5", "w-1/2", "w-2/3", "w-1/3", "w-3/5"];

const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, [role="button"], [data-no-row-click]';

function isFromInteractiveElement(e: MouseEvent) {
  return (e.target as HTMLElement).closest?.(INTERACTIVE_SELECTOR) != null;
}

type SortDir = "asc" | "desc";

// Always shows page 1, the last page, and a window of one neighbor on each
// side of the current page — collapsing any gap larger than one page into a
// single "…". e.g. current=5, total=10 -> [1, "…", 4, 5, 6, "…", 10].
function buildPageList(current: number, total: number): (number | "ellipsis")[] {
  const pages = new Set<number>([1, total]);
  for (let p = current - 1; p <= current + 1; p++) {
    if (p >= 1 && p <= total) pages.add(p);
  }
  const sorted = Array.from(pages).sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("ellipsis");
    result.push(p);
  });
  return result;
}

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
  rowMenuActions,
  getRowLabel,
  toolbarExtra,
  loading = false,
  skeletonRows = 6,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; row: T } | null>(null);

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

  function handleRowClick(e: MouseEvent, row: T) {
    if (!onRowClick || isFromInteractiveElement(e)) return;
    onRowClick(row);
  }

  function handleRowContextMenu(e: MouseEvent, row: T) {
    if (!rowMenuActions || isFromInteractiveElement(e)) return;
    const menuActions = rowMenuActions(row);
    if (menuActions.length === 0) return; // let the native context menu show
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, row });
  }

  if (loading) {
    return (
      // Distinct `key` from the loaded-state root below — without it React
      // reconciles this subtree against the real one on the loading->loaded
      // transition (same element types/positions), which briefly turns the
      // search input's `value` prop from a plain string into `undefined`
      // one commit before its post-loading value lands, tripping React's
      // controlled-input warning. A different key forces a clean
      // unmount/mount instead of a partial update.
      <div key="skeleton" className="flex flex-col gap-3">
        {(columns.some((c) => c.filterValue) || toolbarExtra) && (
          <div className="flex flex-wrap items-center gap-2">
            {columns.some((c) => c.filterValue) && (
              <div className="relative max-w-[240px] flex-1">
                <IoSearchOutline className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input
                  value=""
                  readOnly
                  disabled
                  placeholder={searchPlaceholder}
                  className="h-7 w-full rounded-full border border-transparent bg-[#f8f8fa] pl-7 pr-3 text-sm text-foreground placeholder:text-[#9da3af]"
                />
              </div>
            )}
            {toolbarExtra}
          </div>
        )}

        {/* Table: sm and up */}
        <div className="hidden overflow-x-auto rounded border border-[#e1e1e6] sm:block">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#e1e1e6] bg-[#f2f2f5]">
                {columns.map((col) => (
                  <th key={col.key} className="px-3 py-2 text-left font-medium text-black">
                    {col.header}
                  </th>
                ))}
                {actions && <th className="px-3 py-2 text-right font-medium text-black">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: skeletonRows }).map((_, r) => (
                <tr key={r} className="border-b border-[#f2f2f2] last:border-0">
                  {columns.map((col, ci) => (
                    <td key={col.key} className="px-3 py-2">
                      <Skeleton className={cn("h-4", SKELETON_WIDTHS[(r + ci) % SKELETON_WIDTHS.length])} />
                    </td>
                  ))}
                  {actions && (
                    <td className="px-3 py-2 text-right">
                      <Skeleton className="ml-auto h-4 w-14" />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stacked cards: below sm */}
        <div className="flex flex-col gap-2 sm:hidden">
          {Array.from({ length: skeletonRows }).map((_, r) => (
            <div key={r} className="flex flex-col gap-2 rounded border border-border bg-card p-3">
              {columns.map((col, ci) => (
                <div key={col.key} className="flex items-center justify-between gap-3 py-0.5">
                  <span className="text-sm text-muted-foreground">{col.header}</span>
                  <Skeleton className={cn("h-4", SKELETON_WIDTHS[(r + ci) % SKELETON_WIDTHS.length])} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div key="data" className="flex flex-col gap-3">
      {(columns.some((c) => c.filterValue) || toolbarExtra) && (
        <div className="flex flex-wrap items-center gap-2">
          {columns.some((c) => c.filterValue) && (
            <div className="relative max-w-[240px] flex-1">
              <IoSearchOutline className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder={searchPlaceholder}
                className="h-7 w-full rounded-full border border-transparent bg-[#f8f8fa] pl-7 pr-3 text-sm text-foreground placeholder:text-[#9da3af] transition-colors focus-visible:border-primary/40 focus-visible:bg-background focus-visible:outline-none"
              />
            </div>
          )}
          {toolbarExtra}
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
                    onClick={(e) => handleRowClick(e, row)}
                    onContextMenu={(e) => handleRowContextMenu(e, row)}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (onRowClick && (e.key === "Enter" || e.key === " ") && !isFromInteractiveElement(e as unknown as MouseEvent)) {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }}
                    className={cn(
                      "border-b border-[#f2f2f2] last:border-0 hover:bg-[#f2f2f5]",
                      onRowClick && "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2",
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
                onClick={(e) => handleRowClick(e, row)}
                onContextMenu={(e) => handleRowContextMenu(e, row)}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === "Enter" || e.key === " ") && !isFromInteractiveElement(e as unknown as MouseEvent)) {
                    e.preventDefault();
                    onRowClick(row);
                  }
                }}
                className={cn(
                  "rounded border border-border bg-card p-3",
                  onRowClick && "cursor-pointer hover:bg-[#f2f2f5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
                )}
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
              <nav className="flex items-center gap-1" aria-label="Pagination">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={clampedPage <= 1}
                  onClick={() => { setContextMenu(null); setPage((p) => p - 1); }}
                  aria-label="Previous page"
                >
                  <IoChevronBack size={14} />
                </Button>
                {buildPageList(clampedPage, totalPages).map((item, i) =>
                  item === "ellipsis" ? (
                    <span key={`ellipsis-${i}`} className="px-1.5 text-muted-foreground">
                      …
                    </span>
                  ) : (
                    <Button
                      key={item}
                      variant={item === clampedPage ? "primary" : "secondary"}
                      size="sm"
                      disabled={item === clampedPage}
                      onClick={() => { setContextMenu(null); setPage(item); }}
                      className="min-w-[2rem]"
                      aria-current={item === clampedPage ? "page" : undefined}
                    >
                      {item}
                    </Button>
                  ),
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={clampedPage >= totalPages}
                  onClick={() => { setContextMenu(null); setPage((p) => p + 1); }}
                  aria-label="Next page"
                >
                  <IoChevronForward size={14} />
                </Button>
              </nav>
            </div>
          )}
        </>
      )}

      {contextMenu && rowMenuActions && (
        <RowContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          label={getRowLabel?.(contextMenu.row)}
          actions={rowMenuActions(contextMenu.row)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
