"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaChevronLeft } from "react-icons/fa6";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { formatDisplayDate } from "@/lib/date";
import { formatAuditActor, formatAuditChange } from "@/lib/audit";
import type { Lead } from "@/lib/leads";
import type { EscapePoint } from "@/lib/escape-points";
import { ConvertToEscapeModal } from "@/components/leads/ConvertToEscapeModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchLeads, contactLead, qualifyLead, toggleLeadPriority, applyLeadReasonAction, setLeadFollowUpDueDate, fetchLeadAuditLog } from "@/features/leads/leadsThunks";
import { clearAuditLog } from "@/features/leads/leadsSlice";
import type { LeadReasonAction } from "@/features/leads/types";
import { selectLeadActionStatus, selectLeadActionError, selectLeadAuditLog, selectLeadAuditLogStatus } from "@/features/leads/leadsSelectors";

const TERMINAL_STATUSES = ["Unqualified", "Lost", "Duplicate", "Converted"];

function BackToLeads() {
  return (
    <Link
      href="/leads"
      className="inline-flex w-fit items-center gap-0.5 text-[13px] text-foreground/70 transition-colors hover:text-foreground"
    >
      <FaChevronLeft size={12} className="shrink-0" />
      <span className="font-semibold">Back to Leads</span>
    </Link>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

// The premium, dedicated Lead Details page — replaces the old View modal
// (a lead carries too much information + history to do justice in a
// popup). Everything descriptive is shown directly on the page; the status
// actions and follow-up editor stay exactly as they worked in the modal.
export function LeadDetailPanel({
  lead,
  escapePoints,
}: {
  lead: Lead;
  escapePoints: EscapePoint[];
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const busy = useAppSelector(selectLeadActionStatus) === "loading";
  const error = useAppSelector(selectLeadActionError);
  const auditLog = useAppSelector(selectLeadAuditLog);
  const loadingAudit = useAppSelector(selectLeadAuditLogStatus) === "loading";

  const [reasonPrompt, setReasonPrompt] = useState<LeadReasonAction | null>(null);
  const [reason, setReason] = useState("");
  const [convertOpen, setConvertOpen] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(lead.followUpDueDate ?? "");

  useEffect(() => {
    dispatch(fetchLeadAuditLog(lead.uid));
    return () => {
      dispatch(clearAuditLog());
    };
  }, [dispatch, lead.uid]);

  const isTerminal = TERMINAL_STATUSES.includes(lead.status);

  async function afterAction() {
    setReasonPrompt(null);
    setReason("");
    await dispatch(fetchLeads());
    dispatch(fetchLeadAuditLog(lead.uid));
    router.refresh();
  }

  async function handleContact() {
    try {
      await dispatch(contactLead(lead.uid)).unwrap();
      await afterAction();
    } catch {
      // actionError already set in the slice, rendered below.
    }
  }

  async function handleQualify() {
    try {
      await dispatch(qualifyLead(lead.uid)).unwrap();
      await afterAction();
    } catch {
      // actionError already set in the slice.
    }
  }

  async function handleTogglePriority() {
    try {
      await dispatch(toggleLeadPriority(lead.uid)).unwrap();
      await afterAction();
    } catch {
      // actionError already set in the slice.
    }
  }

  async function handleReasonAction(action: LeadReasonAction) {
    try {
      await dispatch(applyLeadReasonAction({ leadUid: lead.uid, action, reason })).unwrap();
      await afterAction();
    } catch {
      // actionError already set in the slice.
    }
  }

  async function handleSetFollowUpDate() {
    try {
      await dispatch(setLeadFollowUpDueDate({ leadUid: lead.uid, followUpDueDate: followUpDate || null })).unwrap();
      await afterAction();
    } catch {
      // actionError already set in the slice.
    }
  }

  return (
    <Card variant="page" className="flex min-h-full flex-col gap-4">
      <BackToLeads />

      {/* Header */}
      <div className="rounded-2xl border border-border bg-muted/20 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight text-foreground md:text-3xl">{lead.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone={isTerminal ? (lead.status === "Converted" ? "success" : "danger") : "neutral"}>{lead.status}</Badge>
              {lead.isPriority && <Badge tone="warning">Priority</Badge>}
              {lead.sourceType === "AGENCY" ? (
                <Badge tone="neutral">Agency</Badge>
              ) : (
                lead.sourceChannel && <Badge tone="neutral">{lead.sourceChannel}</Badge>
              )}
            </div>
          </div>
          {lead.createdAt && (
            <div className="shrink-0 text-right">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Created</div>
              <div className="mt-1 text-sm font-semibold text-foreground">{formatDisplayDate(lead.createdAt)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Quick facts */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Email" value={lead.email || "—"} />
        <StatCard label="Phone" value={lead.phone || "—"} />
        <StatCard label="Escape Point" value={lead.destination || "—"} />
        <StatCard label="Travellers" value={lead.numberOfPeople != null ? String(lead.numberOfPeople) : "—"} />
        <StatCard label="Travel Date" value={formatDisplayDate(lead.travelDate) ?? "—"} />
        <StatCard label="Duration" value={lead.durationDays ? `${lead.durationDays} days` : "—"} />
        <StatCard label="Budget" value={lead.budget != null ? `₹${lead.budget}` : "—"} />
        <StatCard label="Origin City" value={lead.originCity || "—"} />
        <StatCard label="Travel Type" value={lead.travelType || "—"} />
        <StatCard label="Follow-up Due" value={formatDisplayDate(lead.followUpDueDate) ?? "—"} />
      </div>

      {lead.sourceType === "AGENCY" && lead.agencyDetails && (
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <Caption>Agency Details</Caption>
          <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Contact" value={lead.agencyDetails.contactName} />
            {lead.agencyDetails.contactEmail && <StatCard label="Email" value={lead.agencyDetails.contactEmail} />}
            {lead.agencyDetails.contactPhone && <StatCard label="Phone" value={lead.agencyDetails.contactPhone} />}
            {lead.agencyDetails.billingName && <StatCard label="Billing Name" value={lead.agencyDetails.billingName} />}
          </div>
        </div>
      )}

      {lead.notes && (
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <Caption>Notes</Caption>
          <Body className="mt-1 whitespace-pre-wrap leading-6">{lead.notes}</Body>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      {!isTerminal && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4">
          <Caption>Actions</Caption>
          <div className="flex flex-wrap gap-2">
            {lead.status === "New" && (
              <Button size="sm" disabled={busy} onClick={handleContact}>Mark contacted</Button>
            )}
            {(lead.status === "New" || lead.status === "Contacted") && (
              <Button size="sm" disabled={busy} onClick={handleQualify}>Mark qualified</Button>
            )}
            {lead.status === "Qualified" && (
              <Button size="sm" disabled={busy} onClick={() => setConvertOpen(true)}>Convert to escape</Button>
            )}
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => setReasonPrompt("disqualify")}>Disqualify</Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => setReasonPrompt("mark-lost")}>Mark lost</Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => setReasonPrompt("mark-duplicate")}>Mark duplicate</Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={handleTogglePriority}>
              {lead.isPriority ? "Unmark priority" : "Mark priority"}
            </Button>
          </div>

          {reasonPrompt && (
            <div className="flex flex-col gap-2 rounded border border-border p-3">
              <label htmlFor="lead-reason" className="text-sm font-medium text-foreground">Reason</label>
              <textarea
                id="lead-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="danger"
                  disabled={busy}
                  onClick={() => handleReasonAction(reasonPrompt)}
                >
                  Confirm
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setReasonPrompt(null)}>Cancel</Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 rounded border border-border p-3">
            <Caption>Follow-up due</Caption>
            <div className="flex gap-2">
              <DatePicker
                className="max-w-xs"
                value={followUpDate}
                onChange={setFollowUpDate}
              />
              <Button size="sm" disabled={busy} onClick={handleSetFollowUpDate}>Save</Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <Caption>History</Caption>
        {loadingAudit && <LoadingState />}
        {!loadingAudit && auditLog && auditLog.length === 0 && <Body muted className="mt-2">No history yet.</Body>}
        {!loadingAudit && auditLog && auditLog.length > 0 && (
          <div className="mt-2 flex flex-col">
            {auditLog.map((entry, i) => {
              const change = formatAuditChange(entry.previousValue, entry.newValue);
              const time = new Date(entry.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
              const isNegative = /DISQUALIFI|LOST/.test(entry.action.toUpperCase());
              return (
                <div key={i} className="flex gap-3 pb-4 last:pb-0">
                  <div className="w-20 shrink-0 pt-0.5 text-right">
                    <div className="text-xs font-medium text-foreground">{formatDisplayDate(entry.createdAt)}</div>
                    <div className="text-xs text-muted-foreground">{time}</div>
                  </div>
                  <div className="relative flex w-5 shrink-0 flex-col items-center">
                    {i < auditLog.length - 1 && (
                      <span className="absolute left-1/2 top-5 h-full w-1 -translate-x-1/2 bg-border" aria-hidden="true" />
                    )}
                    <span className={`relative z-10 mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isNegative ? "bg-danger/15" : "bg-primary/15"}`}>
                      <span className={`h-2 w-2 rounded-full ${isNegative ? "bg-danger" : "bg-primary"}`} />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <span className="font-medium text-foreground">{entry.action}</span>{" "}
                    <span className="text-muted-foreground">by {formatAuditActor(entry.performedByName)}</span>
                    {change && <div className="mt-0.5 text-xs text-muted-foreground">{change}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {convertOpen && (
        <ConvertToEscapeModal lead={lead} escapePoints={escapePoints} onClose={() => setConvertOpen(false)} />
      )}
    </Card>
  );
}
