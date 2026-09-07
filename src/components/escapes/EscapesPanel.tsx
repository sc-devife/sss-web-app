"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { ToolbarSelect } from "@/components/ui/ToolbarSelect";
import { Badge } from "@/components/ui/Badge";
import { Body } from "@/components/ui/Typography";
import { formatDisplayDate } from "@/lib/date";
import type { Escape } from "@/lib/escapes";
import { ESCAPE_STATUS_ORDER, ESCAPE_STATUS_CANCELLED } from "@/lib/escape-status";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchEscapes } from "@/features/escapes/escapesThunks";
import { selectEscapes, selectEscapesStatus, selectEscapesError } from "@/features/escapes/escapesSelectors";

const TERMINAL_TONES: Record<string, "success" | "danger" | "neutral"> = {
  Completed: "success",
  Cancelled: "danger",
};

// Every valid status (mirrors backend EscapeStatus.ORDER + CANCELLED, via
// the same shared constant already used for status badges/icons elsewhere)
// — not just whichever statuses happen to be present in today's data, so
// the filter doesn't silently miss one once an escape reaches it.
const STATUS_OPTIONS = [
  { value: "", label: "Default" },
  ...[...ESCAPE_STATUS_ORDER, ESCAPE_STATUS_CANCELLED].map((s) => ({ value: s, label: s })),
];

const SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "oldest", label: "Oldest" },
];

export function EscapesPanel() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const escapes = useAppSelector(selectEscapes);
  const status = useAppSelector(selectEscapesStatus);
  const error = useAppSelector(selectEscapesError);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    dispatch(fetchEscapes());
  }, [dispatch]);

  // Sort/status stay client-side, same as DataTable's own search/pagination
  // — no backend change needed, the full list is already fetched up front.
  const visibleEscapes = useMemo(() => {
    const filteredByStatus = statusFilter ? escapes.filter((e) => e.status === statusFilter) : escapes;
    return [...filteredByStatus].sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === "latest" ? bt - at : at - bt;
    });
  }, [escapes, statusFilter, sortOrder]);

  const columns: DataTableColumn<Escape>[] = [
    {
      key: "lead",
      header: "Customer",
      render: (t) => t.lead?.name ?? "—",
      filterValue: (t) => t.lead?.name ?? "",
    },
    {
      key: "escapePoints",
      header: "Escape Points",
      render: (t) => t.escapePoints.map((d) => d.name).join(", ") || "—",
      filterValue: (t) => t.escapePoints.map((d) => d.name).join(" "),
    },
    {
      key: "dates",
      header: "Dates",
      render: (t) => (t.startDate ? `${formatDisplayDate(t.startDate)} (${t.numberOfDays ?? "?"}d)` : "—"),
    },
    {
      key: "travellers",
      header: "Travellers",
      render: (t) => t.travellers.length,
      sortValue: (t) => t.travellers.length,
    },
    {
      key: "status",
      header: "Status",
      render: (t) => <Badge tone={TERMINAL_TONES[t.status] ?? "neutral"}>{t.status}</Badge>,
      sortValue: (t) => t.status,
    },
  ];

  if (status === "failed") {
    return <Body className="text-danger">{error}</Body>;
  }

  return (
    <DataTable
      columns={columns}
      rows={visibleEscapes}
      rowKey={(t) => t.uid}
      searchPlaceholder="Search escapes…"
      emptyMessage="No escapes yet — convert a qualified lead to get started."
      onRowClick={(t) => router.push(`/escapes/${t.uid}`)}
      loading={status !== "succeeded" && escapes.length === 0}
      toolbarExtra={
        <div className="flex items-center gap-2">
          <ToolbarSelect label="Sort" options={SORT_OPTIONS} value={sortOrder} onChange={(v) => setSortOrder(v as "latest" | "oldest")} />
          <ToolbarSelect label="Status" options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} placeholder="Default" />
        </div>
      }
    />
  );
}
