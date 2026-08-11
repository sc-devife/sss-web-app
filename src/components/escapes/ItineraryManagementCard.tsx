"use client";

import { useEffect, useState, type FormEvent } from "react";
import { IoCheckmarkCircle, IoTimeOutline } from "react-icons/io5";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { ESCAPE_STATUS_ORDER, ESCAPE_STATUS_CANCELLED } from "@/lib/escape-status";
import type { Escape } from "@/lib/escapes";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchItinerariesForEscape, createItinerary, newItineraryVersion, deleteItinerary } from "@/features/itineraries/itinerariesThunks";
import { selectItineraries, selectItinerariesStatus, selectItinerariesError } from "@/features/itineraries/itinerariesSelectors";
import { fetchEscapeById, fetchEscapeAuditLog, advanceEscapeStatus, cancelEscape } from "@/features/escapes/escapesThunks";

// Compact itinerary list + status/cancel controls for the right rail. Only
// shows each itinerary's name/version/status and version/delete actions —
// day-by-day items, terms/inclusions/exclusions, and quotes (previously
// available by expanding an ItineraryCard) aren't rendered on this page for
// now, reserved for the center panel's future functionality. ItineraryCard
// itself is untouched and still used elsewhere its expand/edit flow applies.
export function ItineraryManagementCard({ escapeUid, escape }: { escapeUid: string; escape: Escape }) {
  const dispatch = useAppDispatch();
  const itineraries = useAppSelector(selectItineraries);
  const itinerariesStatus = useAppSelector(selectItinerariesStatus);
  const itinerariesError = useAppSelector(selectItinerariesError);

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [rowBusyUid, setRowBusyUid] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | undefined>();
  const [targetStatus, setTargetStatus] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    dispatch(fetchItinerariesForEscape(escapeUid));
  }, [dispatch, escapeUid]);

  function refreshItineraries() {
    dispatch(fetchItinerariesForEscape(escapeUid));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setFormError(undefined);
    try {
      await dispatch(createItinerary({ escapeUid, name })).unwrap();
      refreshItineraries();
      setName("");
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to create itinerary"));
    } finally {
      setSaving(false);
    }
  }

  async function handleNewVersion(uid: string) {
    setRowBusyUid(uid);
    try {
      await dispatch(newItineraryVersion(uid));
      refreshItineraries();
    } finally {
      setRowBusyUid(null);
    }
  }

  async function handleDelete(uid: string) {
    setRowBusyUid(uid);
    try {
      await dispatch(deleteItinerary(uid));
      refreshItineraries();
    } finally {
      setRowBusyUid(null);
    }
  }

  const isCancelled = escape.status === ESCAPE_STATUS_CANCELLED;
  const currentIndex = ESCAPE_STATUS_ORDER.indexOf(escape.status as (typeof ESCAPE_STATUS_ORDER)[number]);
  const ongoingIndex = ESCAPE_STATUS_ORDER.indexOf("Ongoing");
  const canCancel = !isCancelled && currentIndex >= 0 && currentIndex < ongoingIndex;
  const futureStatuses = currentIndex >= 0 ? ESCAPE_STATUS_ORDER.slice(currentIndex + 1) : [];

  async function handleAdvance() {
    if (!targetStatus) return;
    setBusy(true);
    setStatusError(undefined);
    try {
      await dispatch(advanceEscapeStatus({ escapeUid, targetStatus })).unwrap();
      dispatch(fetchEscapeById(escapeUid));
      dispatch(fetchEscapeAuditLog(escapeUid));
      setTargetStatus("");
    } catch (err) {
      setStatusError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to advance status"));
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setBusy(true);
    setStatusError(undefined);
    try {
      await dispatch(cancelEscape({ escapeUid, reason: cancelReason })).unwrap();
      dispatch(fetchEscapeById(escapeUid));
      dispatch(fetchEscapeAuditLog(escapeUid));
      setCancelling(false);
    } catch (err) {
      setStatusError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to cancel escape"));
    } finally {
      setBusy(false);
    }
  }

  const sortedItineraries = itineraries.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));

  return (
    <Card variant="elevated" className="flex flex-col gap-2.5 p-3">
      <Caption className="font-semibold">Itineraries</Caption>

      {itinerariesStatus === "loading" && itineraries.length === 0 ? (
        <LoadingState label="Loading itineraries…" />
      ) : itinerariesStatus === "failed" ? (
        <p className="text-xs text-danger">{itinerariesError}</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {sortedItineraries.length === 0 && <p className="text-xs text-muted-foreground">No itineraries yet.</p>}
          {sortedItineraries.map((itinerary) => (
            <div key={itinerary.uid} className="flex flex-col gap-1 rounded border border-border p-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="truncate text-xs font-medium text-foreground">{itinerary.name}</span>
                <Badge
                  tone={itinerary.status === "active" ? "success" : "neutral"}
                  icon={itinerary.status === "active" ? IoCheckmarkCircle : IoTimeOutline}
                >
                  v{itinerary.version} · {itinerary.status}
                </Badge>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="secondary" disabled={rowBusyUid === itinerary.uid} onClick={() => handleNewVersion(itinerary.uid)} className="h-7 px-2 text-xs">
                  New version
                </Button>
                <Button size="sm" variant="danger" disabled={rowBusyUid === itinerary.uid} onClick={() => handleDelete(itinerary.uid)} className="h-7 px-2 text-xs">
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleCreate} className="flex flex-col gap-1.5">
        <TextInput label="New itinerary name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Option A" />
        <Button type="submit" size="sm" disabled={saving}>{saving ? "Adding…" : "Add itinerary"}</Button>
        {formError && <p className="text-xs text-danger">{formError}</p>}
      </form>

      <div className="flex flex-col gap-1.5 border-t border-border pt-2.5">
        {statusError && <p className="text-xs text-danger">{statusError}</p>}

        {!isCancelled && futureStatuses.length > 0 && (
          <>
            <Select
              label=""
              options={futureStatuses.map((s) => ({ value: s, label: s }))}
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
              placeholder="Advance to…"
            />
            <Button size="sm" disabled={busy || !targetStatus} onClick={handleAdvance}>Advance</Button>
            {canCancel && (
              <Button size="sm" variant="danger" disabled={busy} onClick={() => setCancelling(true)}>Cancel escape</Button>
            )}
          </>
        )}

        {cancelling && (
          <div className="flex flex-col gap-1.5 rounded border border-border p-2">
            <label htmlFor="cancel-reason" className="text-xs font-medium text-foreground">Cancellation reason</label>
            <textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={2}
              className="rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            />
            <div className="flex gap-1.5">
              <Button size="sm" variant="danger" disabled={busy} onClick={handleCancel} className="h-7 px-2 text-xs">Confirm cancellation</Button>
              <Button size="sm" variant="ghost" onClick={() => setCancelling(false)} className="h-7 px-2 text-xs">Back</Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
