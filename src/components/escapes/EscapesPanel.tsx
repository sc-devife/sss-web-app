"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Body } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import type { Escape } from "@/lib/escapes";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchEscapes } from "@/features/escapes/escapesThunks";
import { selectEscapes, selectEscapesStatus, selectEscapesError } from "@/features/escapes/escapesSelectors";

const TERMINAL_TONES: Record<string, "success" | "danger" | "neutral"> = {
  Completed: "success",
  Cancelled: "danger",
};

export function EscapesPanel() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const escapes = useAppSelector(selectEscapes);
  const status = useAppSelector(selectEscapesStatus);
  const error = useAppSelector(selectEscapesError);

  useEffect(() => {
    dispatch(fetchEscapes());
  }, [dispatch]);

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
      render: (t) => (t.startDate ? `${t.startDate} (${t.numberOfDays ?? "?"}d)` : "—"),
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

  if (status === "loading" && escapes.length === 0) {
    return <LoadingState label="Loading escapes…" />;
  }

  if (status === "failed") {
    return <Body className="text-danger">{error}</Body>;
  }

  return (
    <DataTable
      columns={columns}
      rows={escapes}
      rowKey={(t) => t.uid}
      searchPlaceholder="Search escapes…"
      emptyMessage="No escapes yet — convert a qualified lead to get started."
      onRowClick={(t) => router.push(`/escapes/${t.uid}`)}
    />
  );
}
