"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import type { Lead, AuditLogEntry } from "@/lib/leads";
import type { AppUser } from "@/lib/users";
import type { Destination } from "@/lib/destinations";
import { ConvertToTripModal } from "@/components/leads/ConvertToTripModal";

const TERMINAL_STATUSES = ["Unqualified", "Lost", "Duplicate", "Converted"];

export function LeadDetailModal({
  lead,
  users,
  destinations,
  onClose,
}: {
  lead: Lead;
  users: AppUser[];
  destinations: Destination[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [reasonPrompt, setReasonPrompt] = useState<"disqualify" | "mark-lost" | "mark-duplicate" | null>(null);
  const [reason, setReason] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [auditLog, setAuditLog] = useState<AuditLogEntry[] | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  useEffect(() => {
    setLoadingAudit(true);
    fetch(`/api/leads/${lead.seqp}/audit-log`)
      .then((r) => r.json())
      .then(setAuditLog)
      .catch(() => setAuditLog([]))
      .finally(() => setLoadingAudit(false));
  }, [lead.seqp]);

  const assignedUser = users.find((u) => u.seqp === lead.assignedToUserId);
  const isTerminal = TERMINAL_STATUSES.includes(lead.status);

  async function runAction(path: string, body?: object) {
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? "Action failed");
      setReasonPrompt(null);
      setReason("");
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleAssign() {
    if (!assigneeId) return;
    await runAction(`/api/leads/${lead.seqp}/assign`, { userId: Number(assigneeId), reason: reason || undefined });
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
          <div><Caption>Destination</Caption><Body>{lead.destination || "—"}</Body></div>
          <div><Caption>Travellers</Caption><Body>{lead.numberOfPeople ?? "—"}</Body></div>
          <div><Caption>Travel date</Caption><Body>{lead.travelDate ?? "—"}</Body></div>
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
                <Button size="sm" disabled={busy} onClick={() => runAction(`/api/leads/${lead.seqp}/actions/contact`)}>Mark contacted</Button>
              )}
              {(lead.status === "New" || lead.status === "Contacted") && (
                <Button size="sm" disabled={busy} onClick={() => runAction(`/api/leads/${lead.seqp}/actions/qualify`)}>Mark qualified</Button>
              )}
              {lead.status === "Qualified" && (
                <Button size="sm" disabled={busy} onClick={() => setConvertOpen(true)}>Convert to trip</Button>
              )}
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => setReasonPrompt("disqualify")}>Disqualify</Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => setReasonPrompt("mark-lost")}>Mark lost</Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => setReasonPrompt("mark-duplicate")}>Mark duplicate</Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => runAction(`/api/leads/${lead.seqp}/actions/toggle-priority`)}>
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
                    onClick={() => runAction(`/api/leads/${lead.seqp}/actions/${reasonPrompt}`, { reason })}
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
          {loadingAudit && <Body muted>Loading…</Body>}
          {!loadingAudit && auditLog && auditLog.length === 0 && <Body muted>No history yet.</Body>}
          {!loadingAudit && auditLog && auditLog.length > 0 && (
            <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
              {auditLog.map((entry, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium text-foreground">{entry.action}</span>{" "}
                  <span className="text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>

      {convertOpen && (
        <ConvertToTripModal lead={lead} destinations={destinations} onClose={() => setConvertOpen(false)} />
      )}
    </Modal>
  );
}
