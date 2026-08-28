"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/date";
import { formatAuditActor, formatAuditChange } from "@/lib/audit";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import type { Lead } from "@/lib/leads";
import type { EscapePoint } from "@/lib/escape-points";
import { ConvertToEscapeModal } from "@/components/leads/ConvertToEscapeModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchLeads, contactLead, qualifyLead, toggleLeadPriority, applyLeadReasonAction, setLeadFollowUpDueDate, fetchLeadAuditLog } from "@/features/leads/leadsThunks";
import { clearAuditLog } from "@/features/leads/leadsSlice";
import type { LeadReasonAction } from "@/features/leads/types";
import { selectLeadActionStatus, selectLeadActionError, selectLeadAuditLog, selectLeadAuditLogStatus } from "@/features/leads/leadsSelectors";

const TERMINAL_STATUSES = ["Unqualified", "Lost", "Duplicate", "Converted"];

export function LeadDetailModal({
  lead,
  escapePoints,
  onClose,
}: {
  lead: Lead;
  escapePoints: EscapePoint[];
  onClose: () => void;
}) {
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
    onClose();
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
    <Modal open onClose={onClose} title={lead.name} className="max-w-xl">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={isTerminal ? (lead.status === "Converted" ? "success" : "danger") : "neutral"}>{lead.status}</Badge>
          {lead.isPriority && <Badge tone="warning">Priority</Badge>}
          {lead.sourceType === "AGENCY" ? (
            <Badge tone="neutral">Agency</Badge>
          ) : (
            lead.sourceChannel && <Badge tone="neutral">{lead.sourceChannel}</Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div><Caption>Email</Caption><Body>{lead.email || "—"}</Body></div>
          <div><Caption>Phone</Caption><Body>{lead.phone || "—"}</Body></div>
          <div><Caption>Escape Point</Caption><Body>{lead.destination || "—"}</Body></div>
          <div><Caption>Travellers</Caption><Body>{lead.numberOfPeople ?? "—"}</Body></div>
          <div><Caption>Travel date</Caption><Body>{formatDisplayDate(lead.travelDate) ?? "—"}</Body></div>
          <div><Caption>Duration</Caption><Body>{lead.durationDays ? `${lead.durationDays} days` : "—"}</Body></div>
          <div><Caption>Budget</Caption><Body>{lead.budget ?? "—"}</Body></div>
          <div><Caption>Origin city</Caption><Body>{lead.originCity || "—"}</Body></div>
          <div><Caption>Travel type</Caption><Body>{lead.travelType || "—"}</Body></div>
          <div><Caption>Follow-up due</Caption><Body>{formatDisplayDate(lead.followUpDueDate) ?? "—"}</Body></div>
        </div>

        {lead.sourceType === "AGENCY" && lead.agencyDetails && (
          <div className="rounded border border-border p-3">
            <Caption className="mb-1 block">Agency details</Caption>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div><Caption>Contact</Caption><Body>{lead.agencyDetails.contactName}</Body></div>
              {lead.agencyDetails.contactEmail && <div><Caption>Email</Caption><Body>{lead.agencyDetails.contactEmail}</Body></div>}
              {lead.agencyDetails.contactPhone && <div><Caption>Phone</Caption><Body>{lead.agencyDetails.contactPhone}</Body></div>}
              {lead.agencyDetails.billingName && <div><Caption>Billing name</Caption><Body>{lead.agencyDetails.billingName}</Body></div>}
            </div>
          </div>
        )}

        {lead.notes && (
          <div>
            <Caption>Notes</Caption>
            <Body>{lead.notes}</Body>
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        {!isTerminal && (
          <div className="flex flex-col gap-3 border-t border-border pt-4">
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
                <TextInput
                  label=""
                  type="date"
                  className="flex-1"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
                <Button size="sm" disabled={busy} onClick={handleSetFollowUpDate}>Save</Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <Caption>History</Caption>
          {loadingAudit && <LoadingState />}
          {!loadingAudit && auditLog && auditLog.length === 0 && <Body muted>No history yet.</Body>}
          {!loadingAudit && auditLog && auditLog.length > 0 && (
            <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
              {auditLog.map((entry, i) => {
                const change = formatAuditChange(entry.previousValue, entry.newValue);
                return (
                  <div key={i} className="text-sm">
                    <span className="font-medium text-foreground">{entry.action}</span>{" "}
                    <span className="text-muted-foreground">
                      by {formatAuditActor(entry.performedByName)}, {formatDisplayDateTime(entry.createdAt)}
                    </span>
                    {change && <div className="text-xs text-muted-foreground">{change}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>

      {convertOpen && (
        <ConvertToEscapeModal lead={lead} escapePoints={escapePoints} onClose={() => setConvertOpen(false)} />
      )}
    </Modal>
  );
}
