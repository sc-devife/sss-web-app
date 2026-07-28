"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Caption } from "@/components/ui/Typography";
import type { Itinerary } from "@/lib/itineraries";
import type { Hotel } from "@/lib/hotels";
import type { Activity } from "@/lib/activities";
import type { Transport } from "@/lib/transports";
import { ItineraryCard } from "@/components/trips/ItineraryCard";

export function ItinerariesSection({
  tripId,
  initialItineraries,
  hotels,
  activities,
  transports,
}: {
  tripId: number;
  initialItineraries: Itinerary[];
  hotels: Hotel[];
  activities: Activity[];
  transports: Transport[];
}) {
  const [itineraries, setItineraries] = useState(initialItineraries);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function refresh() {
    const res = await fetch(`/api/itineraries?tripId=${tripId}`);
    setItineraries(await res.json());
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(undefined);
    try {
      const res = await fetch("/api/itineraries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, name }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message ?? "Failed to create itinerary");
      setName("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create itinerary");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Caption>Itineraries</Caption>

      <Card>
        <form onSubmit={handleCreate} className="flex items-end gap-2">
          <TextInput label="New itinerary name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Option A — Beach & City" className="flex-1" />
          <Button type="submit" size="sm" disabled={saving}>{saving ? "Adding…" : "Add itinerary"}</Button>
        </form>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </Card>

      {itineraries.length === 0 && <Caption>No itineraries yet — add one to start planning.</Caption>}

      {itineraries.map((itinerary) => (
        <ItineraryCard
          key={itinerary.uid}
          itinerary={itinerary}
          hotels={hotels}
          activities={activities}
          transports={transports}
          onChanged={refresh}
        />
      ))}
    </div>
  );
}
