"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import { Skeleton } from "@/components/ui/Skeleton";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { notDuplicate, numberInRange, required, runValidators } from "@/lib/validators";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTaxProfiles, createTaxProfile, deactivateTaxProfile, reactivateTaxProfile, deleteTaxProfile } from "@/features/taxProfiles/taxProfilesThunks";
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
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TaxProfile | null>(null);
  const [rowError, setRowError] = useState<string | undefined>();

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

  async function runRowAction(uid: string, action: () => Promise<unknown>) {
    setBusyUid(uid);
    setRowError(undefined);
    try {
      await action();
      dispatch(fetchTaxProfiles());
    } catch (err) {
      setRowError(typeof err === "string" ? err : extractErrorMessage(err, "Action failed"));
    } finally {
      setBusyUid(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {(status === "idle" || status === "loading") && profiles.length === 0 ? (
        <>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="flex items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </Card>
          ))}
        </>
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
                {profile.status === "active" ? (
                  <Button variant="secondary" size="sm" disabled={busyUid === profile.uid} onClick={() => runRowAction(profile.uid, () => dispatch(deactivateTaxProfile(profile.uid)).unwrap())}>Deactivate</Button>
                ) : (
                  <Button variant="secondary" size="sm" disabled={busyUid === profile.uid} onClick={() => runRowAction(profile.uid, () => dispatch(reactivateTaxProfile(profile.uid)).unwrap())}>Reactivate</Button>
                )}
                <Button variant="danger" size="sm" disabled={busyUid === profile.uid} onClick={() => setConfirmDelete(profile)}>Delete</Button>
              </div>
            </Card>
          ))}
          {rowError && <Body className="text-danger">{rowError}</Body>}
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

      <Modal open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Delete tax profile">
        <div className="flex flex-col items-center gap-4 text-center">
          <Body>
            Delete <span className="font-medium">{confirmDelete?.displayName}</span>? This can&apos;t be undone. If quotes already use it, deactivate it instead.
          </Body>
          <div className="flex justify-center gap-2">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                const target = confirmDelete;
                setConfirmDelete(null);
                if (target) runRowAction(target.uid, () => dispatch(deleteTaxProfile(target.uid)).unwrap());
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
