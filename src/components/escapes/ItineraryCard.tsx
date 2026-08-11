"use client";

import { useState } from "react";
import { IoCheckmarkCircle, IoTimeOutline } from "react-icons/io5";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Body } from "@/components/ui/Typography";
import type { Itinerary } from "@/lib/itineraries";
import type { Hotel } from "@/lib/hotels";
import type { Activity } from "@/lib/activities";
import type { Transport } from "@/lib/transports";
import type { ServiceProvider } from "@/lib/service-providers";
import { QuotesPanel } from "@/components/escapes/QuotesPanel";
import { ItineraryContentSection } from "@/components/escapes/ItineraryContentSection";
import { ItineraryDayPlanner } from "@/components/escapes/ItineraryDayPlanner";
import { useAppDispatch } from "@/store/hooks";
import { deleteItinerary, newItineraryVersion } from "@/features/itineraries/itinerariesThunks";

// The center workspace's Planning tab, per itinerary "option" for an Escape.
// This card is itinerary-level chrome (name/version/new-version/delete) —
// the actual day-by-day trip plan lives in ItineraryDayPlanner, and Terms/
// Inclusions/Exclusions + Quotes are unrelated sections rendered below it.
export function ItineraryCard({
  itinerary,
  escapeUid,
  hotels,
  activities,
  transports,
  serviceProviders,
  escapeStartDate,
  numberOfDays,
  onChanged,
  onDealChanged,
}: {
  itinerary: Itinerary;
  escapeUid: string;
  hotels: Hotel[];
  activities: Activity[];
  transports: Transport[];
  serviceProviders: ServiceProvider[];
  escapeStartDate: string | null;
  numberOfDays: number | null;
  onChanged: () => void;
  onDealChanged?: () => void;
}) {
  const dispatch = useAppDispatch();
  const [expanded, setExpanded] = useState(true);
  const [busy, setBusy] = useState(false);

  const isSuperseded = itinerary.status === "superseded";

  async function handleNewVersion() {
    setBusy(true);
    try {
      await dispatch(newItineraryVersion(itinerary.uid));
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await dispatch(deleteItinerary(itinerary.uid));
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={() => setExpanded((e) => !e)} className="flex items-center gap-2 text-left">
          <Body className="font-medium">{itinerary.name}</Body>
          <Badge
            tone={isSuperseded ? "neutral" : itinerary.status === "active" ? "success" : "neutral"}
            icon={itinerary.status === "active" ? IoCheckmarkCircle : IoTimeOutline}
          >
            v{itinerary.version} · {itinerary.status}
          </Badge>
        </button>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" disabled={busy} onClick={handleNewVersion}>New version</Button>
          <Button size="sm" variant="danger" disabled={busy} onClick={handleDelete}>Delete</Button>
        </div>
      </div>

      {expanded && (
        <div className="flex flex-col gap-2 border-t border-border pt-2">
          <ItineraryDayPlanner
            itineraryUid={itinerary.uid}
            escapeStartDate={escapeStartDate}
            numberOfDays={numberOfDays}
            hotels={hotels}
            activities={activities}
            transports={transports}
            serviceProviders={serviceProviders}
          />

          <ItineraryContentSection itineraryUid={itinerary.uid} />

          <QuotesPanel itineraryUid={itinerary.uid} escapeUid={escapeUid} onDealChanged={onDealChanged} />
        </div>
      )}
    </div>
  );
}
