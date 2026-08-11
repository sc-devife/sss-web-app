"use client";

import { useEffect } from "react";
import { Body } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { EscapeBreadcrumb } from "@/components/escapes/EscapeBreadcrumb";
import { EscapeSummaryCard } from "@/components/escapes/EscapeSummaryCard";
import { ItineraryManagementCard } from "@/components/escapes/ItineraryManagementCard";
import { DocumentsCard } from "@/components/escapes/DocumentsCard";
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

  useEffect(() => {
    dispatch(fetchEscapeById(escapeUid));
    dispatch(fetchEscapeAuditLog(escapeUid));
    dispatch(fetchDealForEscape(escapeUid));
  }, [dispatch, escapeUid]);

  function handleDealChanged() {
    dispatch(fetchDealForEscape(escapeUid));
  }

  if (escapeStatus === "loading" && !escape) {
    return <LoadingState label="Loading escape…" />;
  }

  if (escapeStatus === "failed" || !escape) {
    return <Body className="text-danger">{escapeError ?? "Failed to load escape"}</Body>;
  }

  return (
    <div className="flex flex-col gap-2">
      <EscapeBreadcrumb escape={escape} />
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_3fr_1fr] lg:items-start">
        {/* Left (20%) — merged escape + traveller profile */}
        <div className="lg:sticky lg:top-6 lg:col-span-1">
          <EscapeSummaryCard escape={escape} auditLog={auditLog} />
        </div>

        {/* Center (60%) — Planning/Activity/History workspace */}
        <div className="lg:col-span-1">
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
            onDealChanged={handleDealChanged}
          />
        </div>

        {/* Right (20%) — itinerary management + documents */}
        <div className="flex flex-col gap-2 lg:col-span-1">
          <ItineraryManagementCard escapeUid={escape.uid} escape={escape} />
          <DocumentsCard deal={deal} />
        </div>
      </div>
    </div>
  );
}
