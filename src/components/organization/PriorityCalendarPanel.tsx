"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchPriorityCalendarEntries,
  createPriorityCalendarEntry,
  deletePriorityCalendarEntry,
} from "@/features/assignmentRules/assignmentRulesThunks";
import {
  selectPriorityCalendarEntries,
  selectPriorityCalendarStatus,
  selectPriorityCalendarError,
} from "@/features/assignmentRules/assignmentRulesSelectors";

const emptyForm = { label: "", startDate: "", endDate: "" };

export function PriorityCalendarPanel() {
  const dispatch = useAppDispatch();
  const entries = useAppSelector(selectPriorityCalendarEntries);
  const status = useAppSelector(selectPriorityCalendarStatus);
  const error = useAppSelector(selectPriorityCalendarError);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [deletingUid, setDeletingUid] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchPriorityCalendarEntries());
  }, [dispatch]);

  function update<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(undefined);
    try {
      await dispatch(createPriorityCalendarEntry(form)).unwrap();
      dispatch(fetchPriorityCalendarEntries());
      setForm(emptyForm);
      setShowForm(false);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to add season"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(uid: string) {
    setDeletingUid(uid);
    try {
      await dispatch(deletePriorityCalendarEntry(uid));
      dispatch(fetchPriorityCalendarEntries());
    } finally {
      setDeletingUid(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Caption>Honeymoon and family leads traveling within one of these windows are auto-flagged as priority.</Caption>

      {status === "loading" && entries.length === 0 ? (
        <LoadingState label="Loading priority calendar…" />
      ) : status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <>
          {entries.length === 0 && !showForm && <Body muted>No vacation seasons configured yet.</Body>}

          {entries.map((entry) => (
            <Card key={entry.uid} className="flex items-center justify-between">
              <div>
                <Body className="font-medium">{entry.label}</Body>
                <Caption>{entry.startDate} – {entry.endDate}</Caption>
              </div>
              <Button variant="danger" size="sm" disabled={deletingUid === entry.uid} onClick={() => handleDelete(entry.uid)}>Remove</Button>
            </Card>
          ))}
        </>
      )}

      {!showForm && (
        <Button variant="secondary" className="self-start" onClick={() => setShowForm(true)}>Add vacation season</Button>
      )}

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
            <TextInput label="Label" value={form.label} onChange={(e) => update("label", e.target.value)} required placeholder="e.g. Diwali 2026" />
            <TextInput label="Start date" type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} required />
            <TextInput label="End date" type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} required />
            {formError && <p className="col-span-3 text-sm text-danger">{formError}</p>}
            <div className="col-span-3 flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save season"}</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
