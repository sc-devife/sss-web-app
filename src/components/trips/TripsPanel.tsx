"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Body } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import type { Trip } from "@/lib/trips";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTrips } from "@/features/trips/tripsThunks";
import { selectTrips, selectTripsStatus, selectTripsError } from "@/features/trips/tripsSelectors";

const TERMINAL_TONES: Record<string, "success" | "danger" | "neutral"> = {
  Completed: "success",
  Cancelled: "danger",
};

export function TripsPanel() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const trips = useAppSelector(selectTrips);
  const status = useAppSelector(selectTripsStatus);
  const error = useAppSelector(selectTripsError);

  useEffect(() => {
    dispatch(fetchTrips());
  }, [dispatch]);

  const columns: DataTableColumn<Trip>[] = [
    {
      key: "lead",
      header: "Customer",
      render: (t) => t.lead?.name ?? "—",
      filterValue: (t) => t.lead?.name ?? "",
    },
    {
      key: "destinations",
      header: "Destinations",
      render: (t) => t.destinations.map((d) => d.name).join(", ") || "—",
      filterValue: (t) => t.destinations.map((d) => d.name).join(" "),
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

  if (status === "loading" && trips.length === 0) {
    return <LoadingState label="Loading trips…" />;
  }

  if (status === "failed") {
    return <Body className="text-danger">{error}</Body>;
  }

  return (
    <DataTable
      columns={columns}
      rows={trips}
      rowKey={(t) => String(t.seqp)}
      searchPlaceholder="Search trips…"
      emptyMessage="No trips yet — convert a qualified lead to get started."
      actions={(t) => (
        <Button variant="secondary" size="sm" onClick={() => router.push(`/trips/${t.seqp}`)}>View</Button>
      )}
    />
  );
}
