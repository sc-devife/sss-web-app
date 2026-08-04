"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Heading, Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { ItinerariesSection } from "@/components/trips/ItinerariesSection";
import { DealPanel } from "@/components/trips/DealPanel";
import type { Hotel } from "@/lib/hotels";
import type { Activity } from "@/lib/activities";
import type { Transport } from "@/lib/transports";
import { TRIP_STATUS_ORDER, TRIP_STATUS_CANCELLED } from "@/lib/trip-status";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTripById, fetchTripAuditLog, advanceTripStatus, cancelTrip } from "@/features/trips/tripsThunks";
import {
  selectCurrentTrip,
  selectCurrentTripStatus,
  selectCurrentTripError,
  selectTripAuditLog,
} from "@/features/trips/tripsSelectors";
import { fetchDealForTrip } from "@/features/deals/dealsThunks";
import { selectDeal } from "@/features/deals/dealsSelectors";

export function TripDetailPanel({
  tripId,
  hotels,
  activities,
  transports,
}: {
  tripId: number;
  hotels: Hotel[];
  activities: Activity[];
  transports: Transport[];
}) {
  const dispatch = useAppDispatch();
  const trip = useAppSelector(selectCurrentTrip);
  const tripStatus = useAppSelector(selectCurrentTripStatus);
  const tripError = useAppSelector(selectCurrentTripError);
  const auditLog = useAppSelector(selectTripAuditLog);
  const deal = useAppSelector(selectDeal);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [targetStatus, setTargetStatus] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    dispatch(fetchTripById(tripId));
    dispatch(fetchTripAuditLog(tripId));
    dispatch(fetchDealForTrip(tripId));
  }, [dispatch, tripId]);

  function refreshDeal() {
    dispatch(fetchDealForTrip(tripId));
  }

  if (tripStatus === "loading" && !trip) {
    return <LoadingState label="Loading trip…" />;
  }

  if (tripStatus === "failed" || !trip) {
    return <Body className="text-danger">{tripError ?? "Failed to load trip"}</Body>;
  }

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
      await dispatch(advanceTripStatus({ tripId, targetStatus })).unwrap();
      dispatch(fetchTripById(tripId));
      dispatch(fetchTripAuditLog(tripId));
      setTargetStatus("");
    } catch (err) {
      setError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to advance status"));
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setBusy(true);
    setError(undefined);
    try {
      await dispatch(cancelTrip({ tripId, reason: cancelReason })).unwrap();
      dispatch(fetchTripById(tripId));
      dispatch(fetchTripAuditLog(tripId));
      setCancelling(false);
    } catch (err) {
      setError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to cancel trip"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Heading as="h2">{trip.lead?.name ?? `Trip #${trip.seqp}`}</Heading>
      <Body muted>{trip.destinations.map((d) => d.name).join(", ") || "No destinations set"}</Body>

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
        hotels={hotels}
        activities={activities}
        transports={transports}
        onDealChanged={refreshDeal}
      />
    </div>
  );
}
