"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Heading, Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { ItinerariesSection } from "@/components/escapes/ItinerariesSection";
import { DealPanel } from "@/components/escapes/DealPanel";
import type { Hotel } from "@/lib/hotels";
import type { Activity } from "@/lib/activities";
import type { Transport } from "@/lib/transports";
import { ESCAPE_STATUS_ORDER, ESCAPE_STATUS_CANCELLED } from "@/lib/escape-status";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchEscapeById, fetchEscapeAuditLog, advanceEscapeStatus, cancelEscape } from "@/features/escapes/escapesThunks";
import {
  selectCurrentEscape,
  selectCurrentEscapeStatus,
  selectCurrentEscapeError,
  selectEscapeAuditLog,
} from "@/features/escapes/escapesSelectors";
import { fetchDealForEscape } from "@/features/deals/dealsThunks";
import { selectDeal } from "@/features/deals/dealsSelectors";

export function EscapeDetailPanel({
  escapeId,
  hotels,
  activities,
  transports,
}: {
  escapeId: number;
  hotels: Hotel[];
  activities: Activity[];
  transports: Transport[];
}) {
  const dispatch = useAppDispatch();
  const escape = useAppSelector(selectCurrentEscape);
  const escapeStatus = useAppSelector(selectCurrentEscapeStatus);
  const escapeError = useAppSelector(selectCurrentEscapeError);
  const auditLog = useAppSelector(selectEscapeAuditLog);
  const deal = useAppSelector(selectDeal);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [targetStatus, setTargetStatus] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    dispatch(fetchEscapeById(escapeId));
    dispatch(fetchEscapeAuditLog(escapeId));
    dispatch(fetchDealForEscape(escapeId));
  }, [dispatch, escapeId]);

  function refreshDeal() {
    dispatch(fetchDealForEscape(escapeId));
  }

  if (escapeStatus === "loading" && !escape) {
    return <LoadingState label="Loading escape…" />;
  }

  if (escapeStatus === "failed" || !escape) {
    return <Body className="text-danger">{escapeError ?? "Failed to load escape"}</Body>;
  }

  const isCancelled = escape.status === ESCAPE_STATUS_CANCELLED;
  const currentIndex = ESCAPE_STATUS_ORDER.indexOf(escape.status as (typeof ESCAPE_STATUS_ORDER)[number]);
  const ongoingIndex = ESCAPE_STATUS_ORDER.indexOf("Ongoing");
  const canCancel = !isCancelled && currentIndex >= 0 && currentIndex < ongoingIndex;
  const futureStatuses = currentIndex >= 0 ? ESCAPE_STATUS_ORDER.slice(currentIndex + 1) : [];

  async function handleAdvance() {
    if (!targetStatus) return;
    setBusy(true);
    setError(undefined);
    try {
      await dispatch(advanceEscapeStatus({ escapeId, targetStatus })).unwrap();
      dispatch(fetchEscapeById(escapeId));
      dispatch(fetchEscapeAuditLog(escapeId));
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
      await dispatch(cancelEscape({ escapeId, reason: cancelReason })).unwrap();
      dispatch(fetchEscapeById(escapeId));
      dispatch(fetchEscapeAuditLog(escapeId));
      setCancelling(false);
    } catch (err) {
      setError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to cancel escape"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Heading as="h2">{escape.lead?.name ?? `Escape #${escape.seqp}`}</Heading>
      <Body muted>{escape.escapePoints.map((d) => d.name).join(", ") || "No escape points set"}</Body>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={isCancelled ? "danger" : escape.status === "Completed" ? "success" : "neutral"}>{escape.status}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <div><Caption>Start date</Caption><Body>{escape.startDate ?? "—"}</Body></div>
          <div><Caption>Duration</Caption><Body>{escape.numberOfDays ? `${escape.numberOfDays} days` : "—"}</Body></div>
          <div><Caption>End date</Caption><Body>{escape.endDate ?? "—"}</Body></div>
          <div><Caption>Travellers</Caption><Body>{escape.travellers.map((t) => `${t.firstName} ${t.lastName ?? ""}`.trim()).join(", ") || "—"}</Body></div>
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
              <Button size="sm" variant="danger" disabled={busy} onClick={() => setCancelling(true)}>Cancel escape</Button>
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
        escapeId={escape.seqp}
        hotels={hotels}
        activities={activities}
        transports={transports}
        onDealChanged={refreshDeal}
      />
    </div>
  );
}
