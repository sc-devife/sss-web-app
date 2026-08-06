"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { notDuplicate, numberInRange, required, runValidators } from "@/lib/validators";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTaxProfiles, createTaxProfile, deactivateTaxProfile } from "@/features/taxProfiles/taxProfilesThunks";
import { selectTaxProfiles, selectTaxProfilesStatus, selectTaxProfilesError } from "@/features/taxProfiles/taxProfilesSelectors";
import type { TaxProfile } from "@/features/taxProfiles/types";

const emptyForm = { name: "", displayName: "", description: "", ratePercent: "" };

type FormState = typeof emptyForm;

function validate(v: FormState, profiles: TaxProfile[]): Record<string, string> {
  const errors: Record<string, string> = {};
  const nameErr = runValidators(v.name, [
    required("Name is required"),
    notDuplicate(profiles, (p) => p.name, "This name is already in use"),
  ]);
  if (nameErr) errors.name = nameErr;
  const displayNameErr = runValidators(v.displayName, [required("Display name is required")]);
  if (displayNameErr) errors.displayName = displayNameErr;
  const rateErr = runValidators(v.ratePercent, [
    required("Rate is required"),
    numberInRange(0, 100, "Must be between 0 and 100"),
  ]);
  if (rateErr) errors.ratePercent = rateErr;
  return errors;
}

export function TaxProfilesPanel() {
  const dispatch = useAppDispatch();
  const profiles = useAppSelector(selectTaxProfiles);
  const status = useAppSelector(selectTaxProfilesStatus);
  const error = useAppSelector(selectTaxProfilesError);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [deactivatingUid, setDeactivatingUid] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchTaxProfiles());
  }, [dispatch]);

  function update<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((p) => ({ ...p, [key]: "" }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(undefined);

    const nextErrors = validate(form, profiles);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await dispatch(
        createTaxProfile({
          name: form.name,
          displayName: form.displayName,
          description: form.description || undefined,
          ratePercent: Number(form.ratePercent),
        }),
      ).unwrap();
      dispatch(fetchTaxProfiles());
      setForm(emptyForm);
      setShowForm(false);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to add tax profile"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(uid: string) {
    setDeactivatingUid(uid);
    try {
      await dispatch(deactivateTaxProfile(uid));
      dispatch(fetchTaxProfiles());
    } finally {
      setDeactivatingUid(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {status === "loading" && profiles.length === 0 ? (
        <LoadingState label="Loading tax profiles…" />
      ) : status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <>
          {profiles.length === 0 && !showForm && <Body muted>No tax profiles yet — add one to use on quotes.</Body>}

          {profiles.map((profile) => (
            <Card key={profile.uid} className="flex items-center justify-between">
              <div>
                <Body className="font-medium">{profile.displayName} · {profile.ratePercent}%</Body>
                <Caption>{profile.description || profile.name}</Caption>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={profile.status === "active" ? "success" : "neutral"}>{profile.status}</Badge>
                {profile.status === "active" && (
                  <Button variant="danger" size="sm" disabled={deactivatingUid === profile.uid} onClick={() => handleDeactivate(profile.uid)}>Deactivate</Button>
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
          Add tax profile
        </Button>
      )}

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <fieldset disabled={saving} className="contents">
              <TextInput
                label="Name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                error={errors.name}
                required
                placeholder="e.g. gst_18"
              />
              <TextInput
                label="Display name"
                value={form.displayName}
                onChange={(e) => update("displayName", e.target.value)}
                error={errors.displayName}
                required
                placeholder="e.g. GST 18%"
              />
              <TextInput
                label="Rate (%)"
                type="number"
                min={0}
                step="0.001"
                value={form.ratePercent}
                onChange={(e) => update("ratePercent", e.target.value)}
                error={errors.ratePercent}
                required
              />
              <TextInput
                label="Description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                className="col-span-2"
              />
            </fieldset>
            {formError && (
              <Alert tone="danger" autoClose={false} className="col-span-2">
                {formError}
              </Alert>
            )}
            <div className="col-span-2 flex gap-2">
              <Button type="submit" disabled={saving} loading={saving} loadingText="Saving…">
                Save tax profile
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
