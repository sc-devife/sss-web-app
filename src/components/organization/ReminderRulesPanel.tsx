"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { integerField, required, runValidators } from "@/lib/validators";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchReminderRules, createReminderRule, deleteReminderRule } from "@/features/reminderRules/reminderRulesThunks";
import { selectReminderRules, selectReminderRulesStatus, selectReminderRulesError } from "@/features/reminderRules/reminderRulesSelectors";

const emptyForm = { label: "", offsetDays: "", recurring: "false" };

type FormState = typeof emptyForm;

function validate(v: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  const labelErr = runValidators(v.label, [required("Label is required")]);
  if (labelErr) errors.label = labelErr;
  const offsetErr = runValidators(v.offsetDays, [required("Offset is required"), integerField("Must be a whole number")]);
  if (offsetErr) errors.offsetDays = offsetErr;
  return errors;
}

export function ReminderRulesPanel() {
  const dispatch = useAppDispatch();
  const rules = useAppSelector(selectReminderRules);
  const status = useAppSelector(selectReminderRulesStatus);
  const error = useAppSelector(selectReminderRulesError);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [deletingUid, setDeletingUid] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchReminderRules());
  }, [dispatch]);

  const usingFallback = rules.length > 0 && rules.every((r) => r.fallback);

  function update<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((p) => ({ ...p, [key]: "" }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(undefined);

    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSaving(true);
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
        <Button
          variant="secondary"
          className="self-start"
          onClick={() => {
            setForm(emptyForm);
            setErrors({});
            setFormError(undefined);
            setShowForm(true);
          }}
        >
          Add reminder rule
        </Button>
      )}

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <fieldset disabled={saving} className="contents">
              <TextInput
                label="Label"
                value={form.label}
                onChange={(e) => update("label", e.target.value)}
                error={errors.label}
                required
                placeholder="e.g. Final notice"
              />
              <TextInput
                label="Offset (days from due date, negative = before)"
                type="number"
                value={form.offsetDays}
                onChange={(e) => update("offsetDays", e.target.value)}
                error={errors.offsetDays}
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
            </fieldset>
            {formError && (
              <Alert tone="danger" autoClose={false} className="col-span-2">
                {formError}
              </Alert>
            )}
            <div className="col-span-2 flex gap-2">
              <Button type="submit" disabled={saving} loading={saving} loadingText="Saving…">
                Save rule
              </Button>
              <Button type="button" variant="ghost" disabled={saving} onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
