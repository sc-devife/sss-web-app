"use client";

import { PiPulseFill } from "react-icons/pi";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { ItineraryCard } from "@/components/escapes/ItineraryCard";
import type { Hotel } from "@/lib/hotels";
import type { Activity } from "@/lib/activities";
import type { Transport } from "@/lib/transports";
import type { EscapeAuditLogEntry } from "@/features/escapes/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchItinerariesForEscape } from "@/features/itineraries/itinerariesThunks";
import { selectItineraries, selectItinerariesStatus } from "@/features/itineraries/itinerariesSelectors";

const TABS = [
  { id: "planning", label: "Planning" },
  { id: "activity", label: "Activity" },
  { id: "history", label: "History" },
];

// The center workspace for an Escape. Planning re-activates the existing
// ItineraryCard detail view (items/content/quotes) — it deliberately does
// NOT dispatch fetchItinerariesForEscape itself, since ItineraryManagementCard
// (right panel, untouched) already owns that fetch and both are mounted on
// the same page; dispatching it again here would be a duplicate GET on every
// load. onChanged below only re-fetches after a user-triggered mutation
// (new version/delete), same pattern the right panel already uses.
export function EscapeWorkspaceTabs({
  escapeUid,
  hotels,
  activities,
  transports,
  auditLog,
  onDealChanged,
}: {
  escapeUid: string;
  hotels: Hotel[];
  activities: Activity[];
  transports: Transport[];
  auditLog: EscapeAuditLogEntry[] | null;
  onDealChanged?: () => void;
}) {
  const dispatch = useAppDispatch();
  const itineraries = useAppSelector(selectItineraries);
  const itinerariesStatus = useAppSelector(selectItinerariesStatus);

  function refreshItineraries() {
    dispatch(fetchItinerariesForEscape(escapeUid));
  }

  const sortedItineraries = itineraries.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));

  return (
    <Tabs tabs={TABS} defaultTab="planning">
      {(active) => {
        if (active === "planning") {
          if (itinerariesStatus === "loading" && itineraries.length === 0) {
            return <LoadingState label="Loading itineraries…" />;
          }
          if (sortedItineraries.length === 0) {
            return (
              <EmptyState
                icon={PiPulseFill}
                title="No itineraries yet"
                description="Add one from the Itineraries panel to start planning."
              />
            );
          }
          return (
            <div className="flex flex-col gap-3">
              {sortedItineraries.map((itinerary) => (
                <ItineraryCard
                  key={itinerary.uid}
                  itinerary={itinerary}
                  escapeUid={escapeUid}
                  hotels={hotels}
                  activities={activities}
                  transports={transports}
                  onChanged={refreshItineraries}
                  onDealChanged={onDealChanged}
                />
              ))}
            </div>
          );
        }

        if (active === "activity") {
          return (
            <EmptyState
              icon={PiPulseFill}
              title="No activity yet"
              description="Escape activity will appear here once available."
            />
          );
        }

        // history
        if (!auditLog || auditLog.length === 0) {
          return <Body muted>No history yet.</Body>;
        }
        return (
          <div className="flex flex-col">
            {auditLog.map((entry, i) => (
              <div key={i} className="relative flex gap-3 pb-5 pl-1 last:pb-0">
                {i < auditLog.length - 1 && (
                  <span className="absolute left-[7px] top-3 h-full w-px bg-border" aria-hidden="true" />
                )}
                <span className="relative z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 border-primary bg-background" />
                <div className="min-w-0">
                  <Body className="font-medium">{entry.action}</Body>
                  <Caption>{new Date(entry.createdAt).toLocaleString()}</Caption>
                </div>
              </div>
            ))}
          </div>
        );
      }}
    </Tabs>
  );
}
