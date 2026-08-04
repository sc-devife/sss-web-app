"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTaxProfiles, createTaxProfile, deactivateTaxProfile } from "@/features/taxProfiles/taxProfilesThunks";
import { selectTaxProfiles, selectTaxProfilesStatus, selectTaxProfilesError } from "@/features/taxProfiles/taxProfilesSelectors";

const emptyForm = { name: "", displayName: "", description: "", ratePercent: "" };

export function TaxProfilesPanel() {
  const dispatch = useAppDispatch();
  const profiles = useAppSelector(selectTaxProfiles);
  const status = useAppSelector(selectTaxProfilesStatus);
  const error = useAppSelector(selectTaxProfilesError);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [deactivatingUid, setDeactivatingUid] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchTaxProfiles());
  }, [dispatch]);

  function update<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(undefined);
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
        <Button variant="secondary" className="self-start" onClick={() => setShowForm(true)}>Add tax profile</Button>
      )}

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <TextInput label="Name" value={form.name} onChange={(e) => update("name", e.target.value)} required placeholder="e.g. gst_18" />
            <TextInput label="Display name" value={form.displayName} onChange={(e) => update("displayName", e.target.value)} required placeholder="e.g. GST 18%" />
            <TextInput label="Rate (%)" type="number" min={0} step="0.001" value={form.ratePercent} onChange={(e) => update("ratePercent", e.target.value)} required />
            <TextInput label="Description" value={form.description} onChange={(e) => update("description", e.target.value)} className="col-span-2" />
            {formError && <p className="col-span-2 text-sm text-danger">{formError}</p>}
            <div className="col-span-2 flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save tax profile"}</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
