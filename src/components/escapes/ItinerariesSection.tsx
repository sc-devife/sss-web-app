"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Caption, Body } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import type { Hotel } from "@/lib/hotels";
import type { Activity } from "@/lib/activities";
import type { Transport } from "@/lib/transports";
import { ItineraryCard } from "@/components/escapes/ItineraryCard";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchItinerariesForEscape, createItinerary } from "@/features/itineraries/itinerariesThunks";
import { selectItineraries, selectItinerariesStatus, selectItinerariesError } from "@/features/itineraries/itinerariesSelectors";

export function ItinerariesSection({
  escapeUid,
  hotels,
  activities,
  transports,
  onDealChanged,
}: {
  escapeUid: string;
  hotels: Hotel[];
  activities: Activity[];
  transports: Transport[];
  onDealChanged?: () => void;
}) {
  const dispatch = useAppDispatch();
  const itineraries = useAppSelector(selectItineraries);
  const status = useAppSelector(selectItinerariesStatus);
  const error = useAppSelector(selectItinerariesError);

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  useEffect(() => {
    dispatch(fetchItinerariesForEscape(escapeUid));
  }, [dispatch, escapeUid]);

  function refresh() {
    dispatch(fetchItinerariesForEscape(escapeUid));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setFormError(undefined);
    try {
      await dispatch(createItinerary({ escapeUid, name })).unwrap();
      refresh();
      setName("");
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to create itinerary"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">

      <Card>
        <form onSubmit={handleCreate} className="flex items-end gap-2">
          <TextInput label="New itinerary name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Option A — Beach & City" className="flex-1" />
          <Button type="submit" size="sm" disabled={saving}>{saving ? "Adding…" : "Add itinerary"}</Button>
        </form>
        {formError && <p className="mt-2 text-sm text-danger">{formError}</p>}
      </Card>

      {status === "loading" && itineraries.length === 0 ? (
        <LoadingState label="Loading itineraries…" />
      ) : status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <>
          {itineraries.length === 0 && <Caption>No itineraries yet — add one to start planning.</Caption>}

          {itineraries.map((itinerary) => (
            <ItineraryCard
              key={itinerary.uid}
              itinerary={itinerary}
              escapeUid={escapeUid}
              hotels={hotels}
              activities={activities}
              transports={transports}
              onChanged={refresh}
              onDealChanged={onDealChanged}
            />
          ))}
        </>
      )}
    </div>
  );
}
