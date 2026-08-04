"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchReminderRules, createReminderRule, deleteReminderRule } from "@/features/reminderRules/reminderRulesThunks";
import { selectReminderRules, selectReminderRulesStatus, selectReminderRulesError } from "@/features/reminderRules/reminderRulesSelectors";

const emptyForm = { label: "", offsetDays: "", recurring: "false" };

export function ReminderRulesPanel() {
  const dispatch = useAppDispatch();
  const rules = useAppSelector(selectReminderRules);
  const status = useAppSelector(selectReminderRulesStatus);
  const error = useAppSelector(selectReminderRulesError);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [deletingUid, setDeletingUid] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchReminderRules());
  }, [dispatch]);

  const usingFallback = rules.length > 0 && rules.every((r) => r.fallback);

  function update<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(undefined);
    try {
      await dispatch(
        createReminderRule({
          label: form.label,
          offsetDays: Number(form.offsetDays),
          recurring: form.recurring === "true",
        }),
      ).unwrap();
      dispatch(fetchReminderRules());
      setForm(emptyForm);
      setShowForm(false);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to add reminder rule"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(uid: string) {
    setDeletingUid(uid);
    try {
      await dispatch(deleteReminderRule(uid));
      dispatch(fetchReminderRules());
    } finally {
      setDeletingUid(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {status === "loading" && rules.length === 0 ? (
        <LoadingState label="Loading reminder rules…" />
      ) : status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <>
          {usingFallback && (
            <Caption>No custom rules yet — the default cadence below is applied (7 days before, 1 day before, on the due date, then every 2 days while overdue).</Caption>
          )}

          {rules.map((rule, i) => (
            <Card key={rule.uid ?? i} className="flex items-center justify-between">
              <div>
                <Body className="font-medium">{rule.label}</Body>
                <Caption>
                  {rule.offsetDays === 0 ? "On due date" : rule.offsetDays > 0 ? `${rule.offsetDays} day(s) after due date` : `${Math.abs(rule.offsetDays)} day(s) before due date`}
                  {rule.recurring && " · repeats"}
                </Caption>
              </div>
              <div className="flex items-center gap-2">
                {rule.fallback && <Badge tone="neutral">default</Badge>}
                {!rule.fallback && rule.uid && (
                  <Button variant="danger" size="sm" disabled={deletingUid === rule.uid} onClick={() => handleDelete(rule.uid!)}>Delete</Button>
                )}
              </div>
            </Card>
          ))}
        </>
      )}

      {!showForm && (
        <Button variant="secondary" className="self-start" onClick={() => setShowForm(true)}>Add reminder rule</Button>
      )}

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <TextInput label="Label" value={form.label} onChange={(e) => update("label", e.target.value)} required placeholder="e.g. Final notice" />
            <TextInput
              label="Offset (days from due date, negative = before)"
              type="number"
              value={form.offsetDays}
              onChange={(e) => update("offsetDays", e.target.value)}
              required
            />
            <Select
              label="Recurring while overdue"
              options={[
                { value: "false", label: "No — send once" },
                { value: "true", label: "Yes — repeat" },
              ]}
              value={form.recurring}
              onChange={(e) => update("recurring", e.target.value)}
            />
            {formError && <p className="col-span-2 text-sm text-danger">{formError}</p>}
            <div className="col-span-2 flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save rule"}</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
