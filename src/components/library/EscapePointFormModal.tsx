"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { FileUpload } from "@/components/ui/FileUpload";
import { Alert } from "@/components/ui/Alert";
import { Caption } from "@/components/ui/Typography";
import type { EscapePoint } from "@/lib/escape-points";
import type { LibraryLocation } from "@/lib/locations";
import { fetchCurrencyOptions, fetchCountryOptions, fetchRegionOptions } from "@/lib/reference-data-client";
import type { ReferenceOption } from "@/lib/reference-data";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useIsDirty } from "@/lib/forms";
import { notDuplicate, required, requiredSelection, runValidators } from "@/lib/validators";
import { useAppDispatch } from "@/store/hooks";
import { createEscapePoint, updateEscapePoint, updateEscapePointLocations } from "@/features/escapePoints/escapePointsThunks";

const emptyForm = {
  id: "",
  name: "",
  description: "",
  images: [] as string[],
  status: "active",
  nearest_airport: "",
  currency: "",
  time_zone: "",
  locationId: "",
};

type FormState = typeof emptyForm;

const emptyNewLocation = { city: "", state: "", country: "", displayName: "" };

function validate(
  v: FormState,
  escapePoints: EscapePoint[],
  editingUid: string | undefined,
  addingLocation: boolean,
  newLocation: typeof emptyNewLocation,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const idErr = runValidators(v.id, [
    required("Escape Point code is required"),
    notDuplicate(escapePoints, (d) => d.id, "This code is already in use", editingUid, (d) => d.uid),
  ]);
  if (idErr) errors.id = idErr;
  const nameErr = runValidators(v.name, [required("Name is required")]);
  if (nameErr) errors.name = nameErr;

  if (addingLocation) {
    const cityErr = runValidators(newLocation.city, [required("City is required")]);
    if (cityErr) errors.newLocationCity = cityErr;
    const displayNameErr = runValidators(newLocation.displayName, [required("Display name is required")]);
    if (displayNameErr) errors.newLocationDisplayName = displayNameErr;
  } else {
    const locErr = requiredSelection(v.locationId, "Please select a location");
    if (locErr) errors.locationId = locErr;
  }
  return errors;
}

// Shared Add/Edit form for Escape Points — used by both the list page
// (EscapePointsPanel, create + edit) and the detail page
// (EscapePointDetailPanel, edit only), same "one form modal, two call
// sites" pattern HotelFormModal already establishes for Hotels.
export function EscapePointFormModal({
  open,
  escapePoint,
  escapePoints,
  locations,
  onClose,
  onSaved,
}: {
  open: boolean;
  escapePoint: EscapePoint | null;
  escapePoints: EscapePoint[];
  locations: LibraryLocation[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const dispatch = useAppDispatch();
  const editing = escapePoint;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [original, setOriginal] = useState<FormState | null>(null);
  const [addingLocation, setAddingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState(emptyNewLocation);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [currencyOptions, setCurrencyOptions] = useState<ReferenceOption[]>([]);

  useEffect(() => {
    fetchCurrencyOptions().then(setCurrencyOptions);
  }, []);

  // For the new-location "Country" field below — fetched once regardless of
  // whether "+ Add a new location" is ever opened, same idiom HotelFormModal
  // already uses for this exact sub-form.
  const [countryOptions, setCountryOptions] = useState<ReferenceOption[]>([]);
  useEffect(() => {
    fetchCountryOptions().then(setCountryOptions).catch(() => { });
  }, []);

  const newLocationCountryCode = countryOptions.find((c) => c.label === newLocation.country)?.code;
  const [newLocationRegionOptions, setNewLocationRegionOptions] = useState<ReferenceOption[]>([]);
  useEffect(() => {
    if (!newLocationCountryCode) {
      setNewLocationRegionOptions([]);
      return;
    }
    fetchRegionOptions(newLocationCountryCode).then(setNewLocationRegionOptions).catch(() => setNewLocationRegionOptions([]));
  }, [newLocationCountryCode]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const primaryLocationId = editing.locations.find((l) => l.isPrimary)?.uid ?? editing.locations[0]?.uid ?? "";
      const snapshot: FormState = {
        id: editing.id,
        name: editing.name,
        description: editing.description ?? "",
        images: editing.images ?? [],
        status: editing.status ?? "active",
        nearest_airport: editing.nearest_airport ?? "",
        currency: editing.currency ?? "",
        time_zone: editing.time_zone ?? "",
        locationId: primaryLocationId,
      };
      setForm(snapshot);
      setOriginal({ ...snapshot, images: [...snapshot.images] });
    } else {
      setForm(emptyForm);
      setOriginal(null);
    }
    setErrors({});
    setAddingLocation(false);
    setNewLocation(emptyNewLocation);
    setFormError(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing?.uid]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const isDirty = useIsDirty(original, form);
  // Adding a brand-new location while editing is a real change even before
  // `form.locationId` reflects it (that only happens after the location is
  // created, inside handleSubmit below) — don't let the dirty-check block it.
  const canSubmit = !editing || isDirty || addingLocation;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editing && !canSubmit) return;
    setFormError(undefined);

    const nextErrors = validate(form, escapePoints, editing?.uid, addingLocation, newLocation);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      let locationId = form.locationId;

      if (addingLocation) {
        // Locations are their own future module — kept as a direct clientApi
        // call rather than a thunk, same precedent as HotelFormModal's inline
        // location creation.
        const locRes = await clientApi.post<{ uid: string }>("/library/locations", newLocation);
        locationId = locRes.data.uid;
      }

      let escapePointUid = editing?.uid;
      if (editing) {
        await dispatch(updateEscapePoint({ uid: editing.uid, payload: form })).unwrap();
      } else {
        const created = await dispatch(createEscapePoint(form)).unwrap();
        escapePointUid = created.uid;
      }

      // Merge, not replace: the chosen Location is added (if not already
      // attached) and set as primary — any other cities already attached via
      // the separate "Locations" action stay untouched, so this required
      // field can't silently drop a destination's other cities on edit.
      const existingLocationUids = editing?.locations.map((l) => l.uid) ?? [];
      const mergedLocationUids = existingLocationUids.includes(locationId)
        ? existingLocationUids
        : [...existingLocationUids, locationId];
      await dispatch(
        updateEscapePointLocations({
          uid: escapePointUid!,
          locationUids: mergedLocationUids,
          primaryLocationUid: locationId,
        }),
      ).unwrap();

      onSaved();
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save escape point"));
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
      title={editing ? "Edit Escape Point" : "Add Escape Point"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <fieldset disabled={saving} className="contents">
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Code"
              value={form.id}
              onChange={(e) => {
                update("id", e.target.value);
                setErrors((p) => ({ ...p, id: "" }));
              }}
              error={errors.id}
              disabled={!!editing}
              required
            />
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
          </div>

          {!addingLocation ? (
            <div className="flex flex-col gap-1.5">
              <Select
                label="Location"
                options={locations.map((l) => ({ value: l.uid, label: l.displayName }))}
                value={form.locationId}
                onChange={(e) => {
                  update("locationId", e.target.value);
                  setErrors((p) => ({ ...p, locationId: "" }));
                }}
                error={errors.locationId}
                placeholder="Select a location"
                searchable
                required
              />
              <button
                type="button"
                onClick={() => setAddingLocation(true)}
                className="self-start text-sm text-primary hover:underline"
              >
                + Add a new location
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">New location</span>
                <button type="button" onClick={() => setAddingLocation(false)} className="text-sm text-muted-foreground hover:text-foreground">
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  label="City"
                  value={newLocation.city}
                  onChange={(e) => {
                    setNewLocation((l) => ({ ...l, city: e.target.value }));
                    setErrors((p) => ({ ...p, newLocationCity: "" }));
                  }}
                  error={errors.newLocationCity}
                  required
                />
                {/* Stored/matched by state name, not code — mirrors Country
                    below. Options are scoped to the selected country. */}
                <Select
                  label="State"
                  options={newLocationRegionOptions.map((r) => ({ value: r.label, label: r.label }))}
                  value={newLocation.state}
                  onChange={(e) => setNewLocation((l) => ({ ...l, state: e.target.value }))}
                  placeholder={newLocationCountryCode ? "Select a state" : "Select a country first"}
                  disabled={!newLocationCountryCode}
                />
                {/* Stored/matched by country name, not code — mirrors
                    HotelFormModal's identical new-location sub-form. */}
                <Select
                  label="Country"
                  options={countryOptions.map((c) => ({ value: c.label, label: c.label }))}
                  value={newLocation.country}
                  onChange={(e) => setNewLocation((l) => ({ ...l, country: e.target.value }))}
                  placeholder="Select a country"
                />
                <TextInput
                  label="Display name"
                  value={newLocation.displayName}
                  onChange={(e) => {
                    setNewLocation((l) => ({ ...l, displayName: e.target.value }));
                    setErrors((p) => ({ ...p, newLocationDisplayName: "" }));
                  }}
                  error={errors.newLocationDisplayName}
                  placeholder="e.g. Goa, Goa, India"
                  required
                />
              </div>
            </div>
          )}

          {!editing && (
            <Caption className="text-muted-foreground">
              Additional cities this destination covers can be added from the &quot;Locations&quot; action once it&apos;s created.
            </Caption>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium text-foreground">Description</label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
            />
          </div>

          <FileUpload label="Images" value={form.images} onChange={(images) => update("images", images)} />

          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Nearest Airport"
              value={form.nearest_airport}
              onChange={(e) => update("nearest_airport", e.target.value)}
              placeholder="e.g. BOM — Chhatrapati Shivaji Maharaj International"
            />
            <Select
              label="Currency"
              options={currencyOptions.map((c) => ({ value: c.code, label: c.label }))}
              value={form.currency}
              onChange={(e) => update("currency", e.target.value)}
              placeholder="Select a currency"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Time Zone"
              value={form.time_zone}
              onChange={(e) => update("time_zone", e.target.value)}
              placeholder="e.g. Asia/Kolkata"
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
          </div>
        </fieldset>

        {formError && (
          <Alert tone="danger" autoClose={false}>
            {formError}
          </Alert>
        )}

        <div className="flex gap-3 w-full border-t pt-5">
          <Button type="button" variant="ghost" disabled={saving} onClick={onClose} className="w-full">
            Cancel
          </Button>
          <Button type="submit" disabled={saving || (!!editing && !canSubmit)} loading={saving} loadingText="Saving…" className="w-full">
            Save escape point
          </Button>
        </div>
      </form>
    </Modal>
  );
}
