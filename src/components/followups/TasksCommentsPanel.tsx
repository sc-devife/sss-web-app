"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { formatDisplayDateTime } from "@/lib/date";
import { FaPlus } from "react-icons/fa";
import { PiPencilSimple } from "react-icons/pi";
import type { FollowUp, FollowUpStatus } from "@/features/followups/types";
import { FOLLOWUP_STATUS_OPTIONS } from "@/features/followups/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchFollowUpsForLead, fetchFollowUpsForEscape, updateFollowUpStatus, fetchFollowUpCount } from "@/features/followups/followupsThunks";
import {
  selectLeadFollowUps,
  selectLeadFollowUpsStatus,
  selectEscapeFollowUps,
  selectEscapeFollowUpsStatus,
} from "@/features/followups/followupsSelectors";
import { FollowUpFormModal } from "@/components/followups/FollowUpFormModal";

const STATUS_TONE: Record<FollowUpStatus, "neutral" | "warning" | "success"> = {
  Pending: "neutral",
  Hold: "warning",
  Completed: "success",
};

// Reused as-is on both the Lead and Escape detail pages — the single
// implementation the "Follow-up entity/API, not duplicated per record type"
// requirement asks for. Shows every follow-up tied to this record (any
// assignee — a shared team view), not just the current user's own.
export function TasksCommentsPanel({ leadUid, escapeUid }: { leadUid?: string; escapeUid?: string }) {
  const dispatch = useAppDispatch();
  const items = useAppSelector(leadUid ? selectLeadFollowUps : selectEscapeFollowUps);
  const status = useAppSelector(leadUid ? selectLeadFollowUpsStatus : selectEscapeFollowUpsStatus);
  const loading = status === "idle" || status === "loading";

  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FollowUp | null>(null);

  function refetch() {
    if (leadUid) dispatch(fetchFollowUpsForLead(leadUid));
    else if (escapeUid) dispatch(fetchFollowUpsForEscape(escapeUid));
  }

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadUid, escapeUid]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(followUp: FollowUp) {
    setEditing(followUp);
    setModalOpen(true);
  }

  async function handleStatusChange(followUp: FollowUp, next: FollowUpStatus) {
    setUpdatingUid(followUp.uid);
    try {
      await dispatch(updateFollowUpStatus({ followUpUid: followUp.uid, status: next }));
      dispatch(fetchFollowUpCount());
    } finally {
      setUpdatingUid(null);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-2">
        <Caption>Tasks & Comments</Caption>
        <Button size="sm" onClick={openCreate}><FaPlus size={12} />Add Follow-up</Button>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {loading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {!loading && items.length === 0 && <Body muted>No follow-ups yet.</Body>}

        {!loading && items.map((f) => (
          <div key={f.uid} className="flex flex-col gap-2 rounded-lg border border-border bg-background p-3">
            <div className="flex items-start justify-between gap-3">
              <Body className={cn("flex-1 whitespace-pre-wrap", f.status === "Completed" && "text-muted-foreground line-through")}>
                {f.comment}
              </Body>
              <button
                type="button"
                onClick={() => openEdit(f)}
                aria-label="Edit follow-up"
                className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <PiPencilSimple size={16} />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!f.actionable && <Badge tone="neutral">Note</Badge>}
              {f.actionable && (
                <select
                  value={f.status}
                  disabled={updatingUid === f.uid}
                  onChange={(e) => handleStatusChange(f, e.target.value as FollowUpStatus)}
                  className="h-7 rounded border border-border bg-background px-2 text-xs text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {FOLLOWUP_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
              {f.actionable && <Badge tone={STATUS_TONE[f.status]}>{f.status}</Badge>}
              {f.dueAt && <Caption>Due {formatDisplayDateTime(f.dueAt)}</Caption>}
              <Caption>Assigned to {f.assignedToName ?? "—"}</Caption>
              {f.createdByName && <Caption>by {f.createdByName}</Caption>}
            </div>
          </div>
        ))}
      </div>

      <FollowUpFormModal
        open={modalOpen}
        leadUid={editing ? undefined : leadUid}
        escapeUid={editing ? undefined : escapeUid}
        followUp={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          refetch();
          setModalOpen(false);
        }}
      />
    </div>
  );
}
