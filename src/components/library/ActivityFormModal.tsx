"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { FileUpload } from "@/components/ui/FileUpload";
import { Alert } from "@/components/ui/Alert";
import type { Activity } from "@/lib/activities";
import type { EscapePoint } from "@/lib/escape-points";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useIsDirty } from "@/lib/forms";
import { positiveNumber, required, runValidators } from "@/lib/validators";
import { useAppDispatch } from "@/store/hooks";
import { createActivity, updateActivity, fetchActivities } from "@/features/activities/activitiesThunks";

export const CATEGORY_OPTIONS = [
  { value: "water_sports", label: "Water Sports" },
  { value: "sightseeing", label: "Sightseeing" },
  { value: "adventure", label: "Adventure" },
];

const emptyForm = {
  name: "",
  escapePointId: "",
  categoryCode: "",
  durationMinutes: "",
  description: "",
  images: [] as string[],
  basePrice: "",
  status: "active",
};

type FormState = typeof emptyForm;

function validate(v: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  const nameErr = runValidators(v.name, [required("Name is required")]);
  if (nameErr) errors.name = nameErr;
  const durationErr = runValidators(v.durationMinutes, [positiveNumber("Duration must be a positive number")]);
  if (durationErr) errors.durationMinutes = durationErr;
  const priceErr = runValidators(v.basePrice, [positiveNumber("Base price must be a positive number")]);
  if (priceErr) errors.basePrice = priceErr;
  return errors;
}

function snapshotFromActivity(activity: Activity | null): FormState {
  if (!activity) return emptyForm;
  return {
    name: activity.name,
    escapePointId: activity.escapePoint?.uid ?? "",
    categoryCode: activity.categoryCode ?? "",
    durationMinutes: activity.durationMinutes ? String(activity.durationMinutes) : "",
    description: activity.description ?? "",
    images: activity.images ?? [],
    basePrice: activity.basePrice != null ? String(activity.basePrice) : "",
    status: activity.status ?? "active",
  };
}

// Shared Add/Edit Activity form — used by both the Activities list page
// (quick create/edit without leaving the table) and the Activity Details
// page's Edit button, so the two never drift into two different forms.
export function ActivityFormModal({
  open,
  activity,
  onClose,
  onSaved,
  escapePoints,
}: {
  open: boolean;
  activity: Activity | null;
  onClose: () => void;
  onSaved: () => void;
  escapePoints: EscapePoint[];
}) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [original, setOriginal] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  useEffect(() => {
    if (!open) return;
    const snapshot = snapshotFromActivity(activity);
    setForm(snapshot);
    setOriginal(activity ? { ...snapshot, images: [...snapshot.images] } : null);
    setErrors({});
    setFormError(undefined);
  }, [open, activity]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const isDirty = useIsDirty(original, form);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (activity && !isDirty) return;
    setFormError(undefined);

    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        escapePointId: form.escapePointId || null,
        categoryCode: form.categoryCode || null,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
        description: form.description,
        images: form.images,
        basePrice: form.basePrice ? Number(form.basePrice) : null,
        status: form.status,
      };
      if (activity) {
        await dispatch(updateActivity({ uid: activity.uid, payload })).unwrap();
      } else {
        await dispatch(createActivity(payload)).unwrap();
      }
      dispatch(fetchActivities());
      onSaved();
      onClose();
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save activity"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (saving) return;
        onClose();
      }}
      title={activity ? "Edit activity" : "Add activity"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <fieldset disabled={saving} className="contents">
          <TextInput
            label="Name"
            value={form.name}
            onChange={(e) => {
              update("name", e.target.value);
              setErrors((p) => ({ ...p, name: "" }));
            }}
            error={errors.name}
            required
          />

          <Select
            label="Escape Point"
            options={escapePoints.map((d) => ({ value: d.uid, label: d.name }))}
            value={form.escapePointId}
            onChange={(e) => update("escapePointId", e.target.value)}
            placeholder="Select an escape point"
          />

          <Select
            label="Category"
            options={CATEGORY_OPTIONS}
            value={form.categoryCode}
            onChange={(e) => update("categoryCode", e.target.value)}
            placeholder="Select a category"
          />

          <TextInput
            label="Duration (minutes)"
            type="number"
            min={1}
            value={form.durationMinutes}
            onChange={(e) => {
              update("durationMinutes", e.target.value);
              setErrors((p) => ({ ...p, durationMinutes: "" }));
            }}
            error={errors.durationMinutes}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="activity-description" className="text-sm font-medium text-foreground">Description</label>
            <textarea
              id="activity-description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            />
          </div>

          <FileUpload label="Images" value={form.images} onChange={(images) => update("images", images)} />

          <TextInput
            label="Base price (INR)"
            type="number"
            min={0}
            step="0.01"
            value={form.basePrice}
            onChange={(e) => {
              update("basePrice", e.target.value);
              setErrors((p) => ({ ...p, basePrice: "" }));
            }}
            error={errors.basePrice}
          />

          <Select
            label="Status"
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
          />
        </fieldset>

        {formError && (
          <Alert tone="danger" autoClose={false}>
            {formError}
          </Alert>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={saving || (!!activity && !isDirty)} loading={saving} loadingText="Saving…">
            Save activity
          </Button>
          <Button type="button" variant="ghost" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
