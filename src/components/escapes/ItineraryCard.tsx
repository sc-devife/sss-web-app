"use client";

import { useState } from "react";
import { PiCopyFill, PiTrashFill, PiPlusFill } from "react-icons/pi";
import { cn } from "@/lib/cn";
import type { Itinerary } from "@/lib/itineraries";
import type { Hotel } from "@/lib/hotels";
import type { Activity } from "@/lib/activities";
import type { Transport } from "@/lib/transports";
import type { ServiceProvider } from "@/lib/service-providers";
import { QuotesPanel } from "@/components/escapes/QuotesPanel";
import { ItineraryContentSection } from "@/components/escapes/ItineraryContentSection";
import { ItineraryDayPlanner } from "@/components/escapes/ItineraryDayPlanner";
import { useAppDispatch } from "@/store/hooks";
import { deleteItinerary, duplicateItinerary } from "@/features/itineraries/itinerariesThunks";
import { createQuote, fetchQuotesForItinerary } from "@/features/quotes/quotesThunks";

type SubTab = "itinerary" | "terms" | "inclusions" | "quote";

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: "itinerary", label: "Itinerary" },
  { id: "terms", label: "Terms" },
  { id: "inclusions", label: "Inclusions & Exclusions" },
  { id: "quote", label: "Quote" },
];

function IconButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  danger = false,
}: {
  icon: typeof PiCopyFill;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors disabled:opacity-50",
        danger ? "hover:bg-danger/10 hover:text-danger" : "hover:bg-primary/10 hover:text-primary",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

// The center workspace's Planning tab, per itinerary "option" for an Escape.
// The header's own Itinerary/Terms/Inclusions & Exclusions/Quote sub-tabs
// each swap BOTH which content renders below (day planner, terms, inclusions
// + exclusions, or quotes) AND which quick actions show as transparent icon
// buttons on the right (matching the right-rail row actions) — itineraries
// aren't versioned, so "Duplicate" clones the day-plan/content into a
// brand-new itinerary rather than creating a new version of this one.
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
  const [busy, setBusy] = useState(false);
  const [subTab, setSubTab] = useState<SubTab>("itinerary");

  async function handleDuplicate() {
    setBusy(true);
    try {
      await dispatch(duplicateItinerary(itinerary.uid));
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

  async function handleAddQuote() {
    setBusy(true);
    try {
      await dispatch(createQuote({ itineraryUid: itinerary.uid, validUntil: null })).unwrap();
      dispatch(fetchQuotesForItinerary(itinerary.uid));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 lg:h-full lg:min-h-0">
      <div className="flex shrink-0 flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-0.5 rounded-full bg-muted p-1">
            {SUB_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                  subTab === tab.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            {subTab === "itinerary" && (
              <>
                <IconButton icon={PiCopyFill} label="Duplicate itinerary" onClick={handleDuplicate} disabled={busy} />
                <IconButton icon={PiTrashFill} label="Delete itinerary" onClick={handleDelete} disabled={busy} danger />
              </>
            )}
            {subTab === "quote" && (
              <IconButton icon={PiPlusFill} label="Add quote" onClick={handleAddQuote} disabled={busy} />
            )}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 border-t border-border pt-2">
        {subTab === "itinerary" && (
          <ItineraryDayPlanner
            itineraryUid={itinerary.uid}
            escapeStartDate={escapeStartDate}
            numberOfDays={numberOfDays}
            hotels={hotels}
            activities={activities}
            transports={transports}
            serviceProviders={serviceProviders}
          />
        )}

        {subTab === "terms" && <ItineraryContentSection itineraryUid={itinerary.uid} types={["TERMS"]} />}

        {subTab === "inclusions" && (
          <ItineraryContentSection itineraryUid={itinerary.uid} types={["INCLUSION", "EXCLUSION"]} />
        )}

        {subTab === "quote" && (
          <QuotesPanel itineraryUid={itinerary.uid} escapeUid={escapeUid} onDealChanged={onDealChanged} />
        )}
      </div>
    </div>
  );
}
