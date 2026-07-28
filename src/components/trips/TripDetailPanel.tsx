"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import { ItinerariesSection } from "@/components/trips/ItinerariesSection";
import { DealPanel } from "@/components/trips/DealPanel";
import type { Trip } from "@/lib/trips";
import type { Itinerary } from "@/lib/itineraries";
import type { Hotel } from "@/lib/hotels";
import type { Activity } from "@/lib/activities";
import type { Transport } from "@/lib/transports";
import type { Deal } from "@/lib/deals";
import { TRIP_STATUS_ORDER, TRIP_STATUS_CANCELLED } from "@/lib/trip-status";

interface AuditLogEntry {
  action: string;
  previousValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export function TripDetailPanel({
  trip,
  initialItineraries,
  hotels,
  activities,
  transports,
}: {
  trip: Trip;
  initialItineraries: Itinerary[];
  hotels: Hotel[];
  activities: Activity[];
  transports: Transport[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [targetStatus, setTargetStatus] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [auditLog, setAuditLog] = useState<AuditLogEntry[] | null>(null);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [dealVersion, setDealVersion] = useState(0);

  useEffect(() => {
    fetch(`/api/trips/${trip.seqp}/audit-log`)
      .then((r) => r.json())
      .then(setAuditLog)
      .catch(() => setAuditLog([]));
  }, [trip.seqp]);

  useEffect(() => {
    fetch(`/api/deals?tripId=${trip.seqp}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setDeal)
      .catch(() => setDeal(null));
  }, [trip.seqp, dealVersion]);

  const isCancelled = trip.status === TRIP_STATUS_CANCELLED;
  const currentIndex = TRIP_STATUS_ORDER.indexOf(trip.status as (typeof TRIP_STATUS_ORDER)[number]);
  const ongoingIndex = TRIP_STATUS_ORDER.indexOf("Ongoing");
  const canCancel = !isCancelled && currentIndex >= 0 && currentIndex < ongoingIndex;
  const futureStatuses = currentIndex >= 0 ? TRIP_STATUS_ORDER.slice(currentIndex + 1) : [];

  async function handleAdvance() {
    if (!targetStatus) return;
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch(`/api/trips/${trip.seqp}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStatus }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message ?? "Failed to advance status");
      setTargetStatus("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to advance status");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch(`/api/trips/${trip.seqp}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message ?? "Failed to cancel trip");
      setCancelling(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel trip");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={isCancelled ? "danger" : trip.status === "Completed" ? "success" : "neutral"}>{trip.status}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <div><Caption>Start date</Caption><Body>{trip.startDate ?? "—"}</Body></div>
          <div><Caption>Duration</Caption><Body>{trip.numberOfDays ? `${trip.numberOfDays} days` : "—"}</Body></div>
          <div><Caption>End date</Caption><Body>{trip.endDate ?? "—"}</Body></div>
          <div><Caption>Travellers</Caption><Body>{trip.travellers.map((t) => `${t.firstName} ${t.lastName ?? ""}`.trim()).join(", ") || "—"}</Body></div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        {!isCancelled && futureStatuses.length > 0 && (
          <div className="flex items-center gap-2 border-t border-border pt-4">
            <Select
              label=""
              className="max-w-xs"
              options={futureStatuses.map((s) => ({ value: s, label: s }))}
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
              placeholder="Advance to…"
            />
            <Button size="sm" disabled={busy || !targetStatus} onClick={handleAdvance}>Advance</Button>
            {canCancel && (
              <Button size="sm" variant="danger" disabled={busy} onClick={() => setCancelling(true)}>Cancel trip</Button>
            )}
          </div>
        )}

        {cancelling && (
          <div className="flex flex-col gap-2 rounded border border-border p-3">
            <label htmlFor="cancel-reason" className="text-sm font-medium text-foreground">Cancellation reason</label>
            <textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={2}
              className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="danger" disabled={busy} onClick={handleCancel}>Confirm cancellation</Button>
              <Button size="sm" variant="ghost" onClick={() => setCancelling(false)}>Back</Button>
            </div>
          </div>
        )}

        {auditLog && auditLog.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <Caption>History</Caption>
            <div className="flex max-h-40 flex-col gap-1 overflow-y-auto">
              {auditLog.map((entry, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium text-foreground">{entry.action}</span>{" "}
                  <span className="text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {deal && <DealPanel deal={deal} />}

      <ItinerariesSection
        tripId={trip.seqp}
        initialItineraries={initialItineraries}
        hotels={hotels}
        activities={activities}
        transports={transports}
        onDealChanged={() => setDealVersion((v) => v + 1)}
      />
    </div>
  );
}
