"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Body } from "@/components/ui/Typography";
import { cn } from "@/lib/cn";
import { formatDisplayDateTime } from "@/lib/date";
import type { FollowUp, FollowUpFilter, FollowUpStatus } from "@/features/followups/types";
import { FOLLOWUP_STATUS_OPTIONS } from "@/features/followups/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchFollowUps, updateFollowUpStatus, fetchFollowUpCount } from "@/features/followups/followupsThunks";
import {
  selectFollowUps,
  selectFollowUpsStatus,
  selectFollowUpsError,
  selectFollowUpsPage,
  selectFollowUpsTotalPages,
} from "@/features/followups/followupsSelectors";
import { FollowUpFormModal } from "@/components/followups/FollowUpFormModal";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

const FILTER_OPTIONS: { value: FollowUpFilter; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "overdue", label: "Overdue" },
  { value: "upcoming", label: "Upcoming" },
  { value: "all", label: "All" },
];

const STATUS_TONE: Record<FollowUpStatus, "neutral" | "warning" | "success"> = {
  Pending: "neutral",
  Hold: "warning",
  Completed: "success",
};

// Bare native <select> for the table's inline Status cell — no existing
// DataTable-cell dropdown precedent to reuse (the full Select component
// always renders its own label, which would be oversized in a cell); a
// `select` element is already whitelisted by DataTable's INTERACTIVE_SELECTOR
// so this never triggers row navigation.
function StatusSelect({ value, onChange, disabled }: { value: FollowUpStatus; onChange: (next: FollowUpStatus) => void; disabled?: boolean }) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as FollowUpStatus)}
      className={cn(
        "h-8 rounded border border-border bg-background px-2 text-sm text-foreground outline-none",
        "focus:border-primary focus:ring-2 focus:ring-primary/20",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      {FOLLOWUP_STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}

// The dedicated /follow-ups page — every follow-up assigned to the current
// user (never another user's or another org's), server-side filtered/
// searched/paginated exactly like LeadsPanel.
export function FollowUpsPanel() {
  const dispatch = useAppDispatch();
  const followUps = useAppSelector(selectFollowUps);
  const status = useAppSelector(selectFollowUpsStatus);
  const listError = useAppSelector(selectFollowUpsError);
  const serverPage = useAppSelector(selectFollowUpsPage);
  const totalPages = useAppSelector(selectFollowUpsTotalPages);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<FollowUpFilter>("today");
  const [page, setPage] = useState(0);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FollowUp | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(0);
  }

  function handleFilterChange(next: FollowUpFilter) {
    setFilter(next);
    setPage(0);
  }

  useEffect(() => {
    dispatch(fetchFollowUps({ search: debouncedSearch || undefined, filter, page, size: PAGE_SIZE }));
  }, [dispatch, debouncedSearch, filter, page]);

  function refetchCurrentPage() {
    dispatch(fetchFollowUps({ search: debouncedSearch || undefined, filter, page, size: PAGE_SIZE }));
  }

  function openEdit(followUp: FollowUp) {
    setEditing(followUp);
    setModalOpen(true);
  }

  async function handleStatusChange(followUp: FollowUp, next: FollowUpStatus) {
    setUpdatingUid(followUp.uid);
    try {
      await dispatch(updateFollowUpStatus({ followUpUid: followUp.uid, status: next }));
      dispatch(fetchFollowUpCount());
    } finally {
      setUpdatingUid(null);
    }
  }

  const columns: DataTableColumn<FollowUp>[] = [
    {
      key: "comment",
      header: "Task",
      render: (f) => <span className="line-clamp-2 max-w-xs">{f.comment}</span>,
      filterValue: (f) => f.comment,
    },
    {
      key: "lead",
      header: "Lead",
      render: (f) => (f.leadUid ? <Link href={`/leads/${f.leadUid}`} className="text-primary hover:underline">{f.leadName}</Link> : f.leadName || "—"),
    },
    {
      key: "escape",
      header: "Escape",
      render: (f) => (f.escapeUid ? <Link href={`/escapes/${f.escapeUid}`} className="text-primary hover:underline">{f.escapeTripCode}</Link> : "—"),
    },
    {
      key: "dueAt",
      header: "Due Date & Time",
      render: (f) => formatDisplayDateTime(f.dueAt) ?? "—",
    },
    {
      key: "assignedTo",
      header: "Assigned To",
      render: (f) => f.assignedToName ?? "—",
    },
    {
      key: "createdBy",
      header: "Created By",
      render: (f) => f.createdByName ?? "—",
    },
    {
      key: "commentEdit",
      header: "Comment",
      render: (f) => (
        <button
          type="button"
          onClick={() => openEdit(f)}
          className="text-sm text-primary hover:underline"
        >
          Update
        </button>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (f) => (
        <div className="flex items-center gap-2">
          <Badge tone={STATUS_TONE[f.status]}>{f.status}</Badge>
          <StatusSelect
            value={f.status}
            disabled={updatingUid === f.uid}
            onChange={(next) => handleStatusChange(f, next)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {status === "failed" ? (
        <Body className="text-danger">{listError}</Body>
      ) : (
        <DataTable
          columns={columns}
          rows={followUps}
          rowKey={(f) => f.uid}
          searchPlaceholder="Search follow-ups…"
          emptyMessage="No follow-ups yet."
          getRowLabel={(f) => f.comment}
          loading={status === "idle" || status === "loading"}
          serverSearch={{ value: search, onChange: handleSearchChange }}
          serverPagination={{ page: serverPage + 1, totalPages: Math.max(totalPages, 1), onPageChange: (p) => setPage(p - 1) }}
          toolbarExtra={
            <div className="flex items-center gap-1">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleFilterChange(opt.value)}
                  aria-pressed={filter === opt.value}
                  className={cn(
                    "flex h-7 items-center rounded-full px-3 text-sm font-medium transition-colors",
                    filter === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-[#f8f8fa] text-foreground hover:border-primary/30 border border-transparent",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          }
        />
      )}

      <FollowUpFormModal
        open={modalOpen}
        followUp={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          refetchCurrentPage();
          setModalOpen(false);
        }}
      />
    </div>
  );
}
