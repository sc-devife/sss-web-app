"use client";

import { useState } from "react";
import { PiCopyFill, PiPlusFill } from "react-icons/pi";
import { FaTrashCan } from "react-icons/fa6";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Caption } from "@/components/ui/Typography";
import { formatDisplayDateTime } from "@/lib/date";
import { formatAuditActor } from "@/lib/audit";
import type { Itinerary } from "@/lib/itineraries";
import type { Hotel } from "@/lib/hotels";
import type { Activity } from "@/lib/activities";
import type { Transport } from "@/lib/transports";
import type { ServiceProvider } from "@/lib/service-providers";
import { PreviousStatusModal, type PreviousStatus } from "@/components/escapes/PreviousStatusModal";
import { QuotesPanel } from "@/components/escapes/QuotesPanel";
import { SummaryPanel } from "@/components/escapes/SummaryPanel";
import { DocsPanel } from "@/components/escapes/DocsPanel";
import { ItineraryContentSection } from "@/components/escapes/ItineraryContentSection";
import { ItineraryDayPlanner } from "@/components/escapes/ItineraryDayPlanner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectQuotesForItinerary } from "@/features/quotes/quotesSelectors";
import { deleteItinerary, duplicateItinerary } from "@/features/itineraries/itinerariesThunks";
import { createQuote, fetchQuotesForItinerary } from "@/features/quotes/quotesThunks";

type SubTab = "itinerary" | "terms" | "inclusions" | "summary" | "quote" | "docs";

const ITINERARY_STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  draft: "neutral",
  active: "success",
  superseded: "warning",
  rejected: "danger",
};

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: "itinerary", label: "Itinerary" },
  { id: "terms", label: "Terms" },
  { id: "inclusions", label: "Inclusions & Exclusions" },
  { id: "summary", label: "Summary" },
  { id: "quote", label: "Quote" },
  { id: "docs", label: "Docs" },
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
        "flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors disabled:opacity-50",
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
  selectedQuoteUid = null,
  onSelectQuote,
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
  selectedQuoteUid?: string | null;
  onSelectQuote?: (uid: string | null) => void;
}) {
  const dispatch = useAppDispatch();
  const quotes = useAppSelector((s) => selectQuotesForItinerary(s, itinerary.uid));
  const openQuoteCount = quotes.filter((q) => q.status === "draft" || q.status === "sent").length;
  const [askPrevious, setAskPrevious] = useState(false);
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

  function handleAddQuote() {
    if (openQuoteCount > 0) setAskPrevious(true);
    else createQuoteNow(null);
  }

  async function createQuoteNow(previousStatus: PreviousStatus) {
    setBusy(true);
    try {
      await dispatch(createQuote({ itineraryUid: itinerary.uid, validUntil: null, previousStatus: previousStatus ?? undefined })).unwrap();
      const res = await dispatch(fetchQuotesForItinerary(itinerary.uid)).unwrap();
      const newest = res.quotes.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
      if (newest) onSelectQuote?.(newest.uid);
    } finally {
      setAskPrevious(false);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 lg:h-full lg:min-h-0">
      <div className="flex min-w-max shrink-0 flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
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
            {subTab === "quote" && (
              <IconButton icon={PiPlusFill} label="Add Quote" onClick={handleAddQuote} disabled={busy} />
            )}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 border-t border-border pt-2">
        {subTab === "itinerary" && (
          <div className="flex shrink-0 flex-col gap-2 rounded-lg border border-border bg-card p-3">
            <div className="flex flex-nowrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex min-w-0 flex-col">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Itinerary</span>
                  <span className="truncate text-sm font-semibold text-foreground">{itinerary.name}</span>
                </div>
                {itinerary.status && (
                  <Badge tone={ITINERARY_STATUS_TONE[itinerary.status] ?? "neutral"} className="shrink-0">
                    {itinerary.status}
                  </Badge>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <IconButton icon={PiCopyFill} label="Duplicate itinerary" onClick={handleDuplicate} disabled={busy} />
                <IconButton icon={FaTrashCan} label="Delete itinerary" onClick={handleDelete} disabled={busy} danger />
              </div>
            </div>
            <Caption className="self-end whitespace-nowrap text-[10px] leading-none">
              Created {formatDisplayDateTime(itinerary.createdAt)} by {formatAuditActor(itinerary.createdByName ?? null)}
            </Caption>
          </div>
        )}

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

        {subTab === "summary" && <SummaryPanel itineraryUid={itinerary.uid} escapeUid={escapeUid} />}

        {subTab === "quote" && (
          <QuotesPanel
            itineraryUid={itinerary.uid}
            escapeUid={escapeUid}
            onDealChanged={onDealChanged}
            selectedQuoteUid={selectedQuoteUid}
            onSelectQuote={onSelectQuote}
          />
        )}

        {subTab === "docs" && <DocsPanel escapeUid={escapeUid} />}
      </div>

      <PreviousStatusModal
        open={askPrevious}
        kind="quote"
        count={openQuoteCount}
        busy={busy}
        onConfirm={createQuoteNow}
        onCancel={() => setAskPrevious(false)}
      />
    </div>
  );
}
