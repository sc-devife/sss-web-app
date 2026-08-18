"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/date";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import type { Lead } from "@/lib/leads";
import type { AppUser } from "@/lib/users";
import type { EscapePoint } from "@/lib/escape-points";
import { ConvertToEscapeModal } from "@/components/leads/ConvertToEscapeModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchLeads, contactLead, qualifyLead, toggleLeadPriority, applyLeadReasonAction, assignLead, fetchLeadAuditLog } from "@/features/leads/leadsThunks";
import { clearAuditLog } from "@/features/leads/leadsSlice";
import type { LeadReasonAction } from "@/features/leads/types";
import { selectLeadActionStatus, selectLeadActionError, selectLeadAuditLog, selectLeadAuditLogStatus } from "@/features/leads/leadsSelectors";

const TERMINAL_STATUSES = ["Unqualified", "Lost", "Duplicate", "Converted"];

export function LeadDetailModal({
  lead,
  users,
  escapePoints,
  onClose,
}: {
  lead: Lead;
  users: AppUser[];
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
  const [assigneeId, setAssigneeId] = useState("");
  const [convertOpen, setConvertOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchLeadAuditLog(lead.uid));
    return () => {
      dispatch(clearAuditLog());
    };
  }, [dispatch, lead.uid]);

  const assignedUser = users.find((u) => u.seqp === lead.assignedToUserId);
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

  async function handleAssign() {
    if (!assigneeId) return;
    try {
      await dispatch(assignLead({ leadUid: lead.uid, userId: Number(assigneeId), reason: reason || undefined })).unwrap();
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
          {lead.sourceCode && <Badge tone="neutral">{lead.sourceCode}</Badge>}
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
          <div><Caption>Assigned to</Caption><Body>{assignedUser?.name ?? "Unassigned"}</Body></div>
        </div>

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
              <Caption>Assign to</Caption>
              <div className="flex gap-2">
                <Select
                  label=""
                  className="flex-1"
                  options={users.map((u) => ({ value: String(u.seqp), label: u.name }))}
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  placeholder="Select a user"
                />
                <Button size="sm" disabled={busy || !assigneeId} onClick={handleAssign}>Assign</Button>
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
              {auditLog.map((entry, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium text-foreground">{entry.action}</span>{" "}
                  <span className="text-muted-foreground">{formatDisplayDateTime(entry.createdAt)}</span>
                </div>
              ))}
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
