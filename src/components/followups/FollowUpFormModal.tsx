"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { TimePicker } from "@/components/ui/TimePicker";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { todayIsoDate } from "@/lib/date";
import type { FollowUp } from "@/features/followups/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createFollowUp, updateFollowUp, fetchFollowUpCount } from "@/features/followups/followupsThunks";
import { fetchUsers } from "@/features/users/usersThunks";
import { selectOrgUsers } from "@/features/users/usersSelectors";
import { resetCreateStatus } from "@/features/followups/followupsSlice";
import { selectCreateFollowUpStatus, selectCreateFollowUpError } from "@/features/followups/followupsSelectors";

const emptyForm = {
  comment: "",
  actionable: true,
  dueDate: "",
  dueTime: "",
  assignedToUid: "",
};

type FormState = typeof emptyForm;

// Splits a "YYYY-MM-DDTHH:mm:ss" (LocalDateTime, no timezone — the app's
// existing convention) back into the separate Date/Time picker values this
// form edits.
function splitDueAt(dueAt: string | null): { dueDate: string; dueTime: string } {
  if (!dueAt) return { dueDate: "", dueTime: "" };
  const [datePart, timePart] = dueAt.split("T");
  return { dueDate: datePart ?? "", dueTime: timePart ? timePart.slice(0, 5) : "" };
}

function validate(v: FormState): string | undefined {
  if (!v.comment.trim()) return "Comment is required";
  if (v.actionable && (!v.dueDate || !v.dueTime)) return "Due date and time are required for an actionable follow-up";
  return undefined;
}

// Shared Add/Edit Follow-up form — used from the Lead row context menu, the
// Lead/Escape "Tasks & Comments" section, and the /follow-ups page itself.
// Exactly one of leadUid/escapeUid is passed when creating against a
// specific record; `followUp` is passed instead when editing an existing one
// (its own lead/escape association never changes via this form).
export function FollowUpFormModal({
  open,
  leadUid,
  escapeUid,
  followUp,
  onClose,
  onSaved,
}: {
  open: boolean;
  leadUid?: string;
  escapeUid?: string;
  followUp?: FollowUp | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dispatch = useAppDispatch();
  const editing = followUp ?? null;
  const users = useAppSelector(selectOrgUsers);
  const createStatus = useAppSelector(selectCreateFollowUpStatus);
  const createError = useAppSelector(selectCreateFollowUpError);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [validationError, setValidationError] = useState<string | undefined>();

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const { dueDate, dueTime } = splitDueAt(editing.dueAt);
      setForm({
        comment: editing.comment,
        actionable: editing.actionable,
        dueDate,
        dueTime,
        assignedToUid: editing.assignedToUid ?? "",
      });
    } else {
      setForm(emptyForm);
    }
    setValidationError(undefined);
    dispatch(resetCreateStatus());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing?.uid]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validate(form);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(undefined);

    const dueAt = form.actionable && form.dueDate && form.dueTime ? `${form.dueDate}T${form.dueTime}:00` : null;

    try {
      if (editing) {
        await dispatch(
          updateFollowUp({
            followUpUid: editing.uid,
            comment: form.comment,
            actionable: form.actionable,
            dueAt,
            assignedToUid: form.assignedToUid || undefined,
          }),
        ).unwrap();
      } else {
        await dispatch(
          createFollowUp({
            leadUid,
            escapeUid,
            comment: form.comment,
            actionable: form.actionable,
            dueAt,
            assignedToUid: form.assignedToUid || undefined,
          }),
        ).unwrap();
      }
      dispatch(fetchFollowUpCount());
      onSaved();
    } catch {
      // createError is already set in the slice; the form reads it directly.
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit follow-up" : "Add Follow-up"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="followup-comment" className="text-sm font-medium text-foreground">
            Comment / Description <span className="text-danger">*</span>
          </label>
          <textarea
            id="followup-comment"
            value={form.comment}
            onChange={(e) => update("comment", e.target.value)}
            rows={3}
            placeholder="Call customer regarding quotation and confirm hotel preference."
            className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-primary"
            checked={form.actionable}
            onChange={(e) => update("actionable", e.target.checked)}
          />
          Actionable — requires completion (off = just a note/comment)
        </label>

        {form.actionable && (
          <div className="grid grid-cols-2 gap-4">
            <DatePicker label="Due Date" value={form.dueDate} onChange={(v) => update("dueDate", v)} min={todayIsoDate()} required />
            <TimePicker label="Due Time" value={form.dueTime} onChange={(v) => update("dueTime", v)} required />
          </div>
        )}

        <Select
          label="Assign to"
          searchable
          options={users.map((u) => ({ value: u.uid, label: u.name }))}
          value={form.assignedToUid}
          onChange={(e) => update("assignedToUid", e.target.value)}
          placeholder="Defaults to you"
        />

        {(validationError || createError) && <p className="text-sm text-danger">{validationError || createError}</p>}

        <div className="flex gap-3 w-full border-t pt-5">
          <Button type="button" variant="ghost" onClick={onClose} className="w-full">Cancel</Button>
          <Button
            type="submit"
            loading={createStatus === "loading"}
            loadingText="Saving…"
            className="w-full"
          >
            {editing ? "Save changes" : "Save follow-up"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
