"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaChevronLeft } from "react-icons/fa";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import { Body } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { EscapeSummaryCard } from "@/components/escapes/EscapeSummaryCard";
import { ItineraryManagementCard } from "@/components/escapes/ItineraryManagementCard";
import { DocumentsCard } from "@/components/escapes/DocumentsCard";
import { EscapeSidePanel } from "@/components/escapes/EscapeSidePanel";
import { EscapeWorkspaceTabs } from "@/components/escapes/EscapeWorkspaceTabs";
import type { Hotel } from "@/lib/hotels";
import type { Activity } from "@/lib/activities";
import type { Transport } from "@/lib/transports";
import type { ServiceProvider } from "@/lib/service-providers";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchEscapeById, fetchEscapeAuditLog } from "@/features/escapes/escapesThunks";
import {
  selectCurrentEscape,
  selectCurrentEscapeStatus,
  selectCurrentEscapeError,
  selectEscapeAuditLog,
} from "@/features/escapes/escapesSelectors";
import { fetchDealForEscape } from "@/features/deals/dealsThunks";
import { selectDeal } from "@/features/deals/dealsSelectors";

function BackToEscapes() {
  return (
    <Link
      href="/escapes"
      className="inline-flex w-fit items-center gap-0.5 text-[13px] text-foreground/70 transition-colors hover:text-foreground"
    >
      <FaChevronLeft size={12} className="shrink-0" />
      <span className="font-semibold">Back to Escapes</span>
    </Link>
  );
}

export function EscapeDetailPanel({
  escapeUid,
  hotels,
  activities,
  transports,
  serviceProviders,
}: {
  escapeUid: string;
  hotels: Hotel[];
  activities: Activity[];
  transports: Transport[];
  serviceProviders: ServiceProvider[];
}) {
  const dispatch = useAppDispatch();
  const escape = useAppSelector(selectCurrentEscape);
  const escapeStatus = useAppSelector(selectCurrentEscapeStatus);
  const escapeError = useAppSelector(selectCurrentEscapeError);
  const auditLog = useAppSelector(selectEscapeAuditLog);
  const deal = useAppSelector(selectDeal);
  // Owned here (not in EscapeSidePanel) so the outer page container's right
  // margin can shrink/grow in lockstep with the fixed panel's width.
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  // Same idea for the left summary card — its collapsed width has to be
  // reflected in the grid's own column sizing, which only this parent owns.
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);
  // Which itinerary is "selected" — a single source of truth shared by the
  // right rail (ItineraryManagementCard/DocumentsCard, desktop and mobile
  // fallback) and the center workspace's Planning tab, which renders only
  // this one itinerary instead of every itinerary on the escape.
  const [selectedItineraryUid, setSelectedItineraryUid] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchEscapeById(escapeUid));
    dispatch(fetchEscapeAuditLog(escapeUid));
    dispatch(fetchDealForEscape(escapeUid));
  }, [dispatch, escapeUid]);

  function handleDealChanged() {
    dispatch(fetchDealForEscape(escapeUid));
    // Accepting a quote also advances the escape itself (Planning -> Quote
    // Accepted) server-side — refetch it and its audit log too, or the
    // status badge and History tab would only show the change after a
    // manual reload, same staleness bug as the payment-verify flow.
    dispatch(fetchEscapeById(escapeUid));
    dispatch(fetchEscapeAuditLog(escapeUid));
  }

  if (escapeStatus === "loading" && !escape) {
    return (
      <Card variant="page" className="flex min-h-full flex-col gap-2">
        <BackToEscapes />
        <LoadingState label="Loading escape…" />
      </Card>
    );
  }

  if (escapeStatus === "failed" || !escape) {
    return (
      <Card variant="page" className="flex min-h-full flex-col gap-2">
        <BackToEscapes />
        <Body className="text-danger">{escapeError ?? "Failed to load escape"}</Body>
      </Card>
    );
  }

  return (
    <Card
      variant="page"
      className={cn(
        "flex min-h-0 flex-col transition-[margin] duration-200 lg:h-full lg:overflow-hidden",
        // Always exactly the fixed panel's current width (320px expanded,
        // 56px collapsed to its slim rail) — main's own p-2 right padding
        // (8px) supplies the rest, the same way its left padding creates
        // the sidebar-to-card gap, so both sides match either way.
        panelCollapsed ? "lg:mr-14" : "lg:mr-80",
      )}
    >
      {/* Independent inset padding, layered inside the Card's own p-2 —
          Card's baked-in padding utility can silently beat one passed via
          className (same issue noted elsewhere: cn() has no tailwind-merge),
          so a nested box with its own padding is the reliable way to add
          more breathing room here. */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
        <BackToEscapes />
        <div className="border-t border-border" />
        <div
          className={cn(
            "grid grid-cols-1 gap-2 transition-[grid-template-columns] duration-200 lg:min-h-0 lg:flex-1",
            summaryCollapsed ? "lg:grid-cols-[3.5rem_1fr]" : "lg:grid-cols-[1.2fr_3.4fr]",
          )}
        >
          {/* Left — merged escape + traveller profile. Sticky offset only
              here — the height cap + scroll live on the card's own bordered
              element (see EscapeSummaryCard) so the scrollbar renders inside
              the border, not past it. lg:self-start keeps it top-aligned
              instead of stretching to the row's full height like the center
              column now does. */}
          <div className="lg:sticky lg:top-6 lg:col-span-1 lg:self-start">
            <EscapeSummaryCard
              escape={escape}
              auditLog={auditLog}
              collapsed={summaryCollapsed}
              onToggleCollapsed={() => setSummaryCollapsed((v) => !v)}
            />
          </div>

          {/* Center — Planning/Activity/History workspace. Stretches to the
              grid row's full height (desktop only) so its own Tabs content
              box can scroll internally instead of the page ever needing to. */}
          <div className="flex min-w-0 flex-col lg:col-span-1 lg:h-full lg:min-h-0">
            <EscapeWorkspaceTabs
              escapeUid={escape.uid}
              hotels={hotels}
              activities={activities}
              transports={transports}
              serviceProviders={serviceProviders}
              escapeStartDate={escape.startDate}
              numberOfDays={escape.numberOfDays}
              travellers={escape.travellers}
              primaryTravellerUid={escape.primaryTravellerUid}
              leadTravellerCount={escape.lead?.numberOfPeople ?? null}
              auditLog={auditLog}
              deal={deal}
              onDealChanged={handleDealChanged}
              selectedItineraryUid={selectedItineraryUid}
              onSelectItinerary={setSelectedItineraryUid}
            />
          </div>
        </div>

        {/* Below lg: itinerary management + documents fall back into normal
            page flow (the fixed EscapeSidePanel is desktop-only). */}
        <div className="flex flex-col gap-2 lg:hidden">
          <ItineraryManagementCard
            escapeUid={escape.uid}
            selectedUid={selectedItineraryUid}
            onSelect={setSelectedItineraryUid}
          />
          <DocumentsCard deal={deal} escapeUid={escape.uid} selectedItineraryUid={selectedItineraryUid} />
        </div>
      </div>

      <EscapeSidePanel
        escapeUid={escape.uid}
        deal={deal}
        collapsed={panelCollapsed}
        onToggleCollapsed={() => setPanelCollapsed((v) => !v)}
        selectedItineraryUid={selectedItineraryUid}
        onSelectItinerary={setSelectedItineraryUid}
      />
    </Card>
  );
}
