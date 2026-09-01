"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { TimePicker } from "@/components/ui/TimePicker";
import { Select } from "@/components/ui/Select";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Modal } from "@/components/ui/Modal";
import { FileUpload } from "@/components/ui/FileUpload";
import { Alert } from "@/components/ui/Alert";
import type { Hotel } from "@/lib/hotels";
import type { LibraryLocation } from "@/lib/locations";
import type { EscapePoint } from "@/lib/escape-points";
import type { MealPlan } from "@/lib/meal-plans";
import type { RoomType } from "@/lib/room-types";
import type { Service } from "@/lib/services";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useIsDirty } from "@/lib/forms";
import { required, requiredSelection, runValidators } from "@/lib/validators";
import { fetchCountryOptions, fetchRegionOptions } from "@/lib/reference-data-client";
import type { ReferenceOption } from "@/lib/reference-data-client";
import { useAppDispatch } from "@/store/hooks";
import { createHotel, updateHotel, fetchHotels } from "@/features/hotels/hotelsThunks";

export const AMENITY_OPTIONS = [
  { value: "wifi", label: "Wi-Fi" },
  { value: "pool", label: "Pool" },
  { value: "parking", label: "Parking" },
  { value: "gym", label: "Gym" },
  { value: "spa", label: "Spa" },
  { value: "restaurant", label: "Restaurant" },
  { value: "ac", label: "Air Conditioning" },
  { value: "breakfast", label: "Breakfast Included" },
];

const emptyForm = {
  name: "",
  stars: "",
  escapePointId: "",
  locationId: "",
  mealPlanIds: [] as string[],
  roomTypeIds: [] as string[],
  serviceIds: [] as string[],
  checkInTime: "",
  checkOutTime: "",
  childAgeForExtraBed: "",
  rateValidFrom: "",
  rateValidTo: "",
  address: "",
  contactInfo: "",
  images: [] as string[],
  amenities: [] as string[],
  status: "active",
  notes: "",
};

type FormState = typeof emptyForm;

const emptyNewLocation = { city: "", state: "", country: "", displayName: "" };

function validate(
  v: FormState,
  addingLocation: boolean,
  newLocation: typeof emptyNewLocation,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const nameErr = runValidators(v.name, [required("Hotel name is required")]);
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

function snapshotFromHotel(hotel: Hotel | null): FormState {
  if (!hotel) return emptyForm;
  return {
    name: hotel.name,
    stars: hotel.stars ? String(hotel.stars) : "",
    escapePointId: hotel.escapePoint?.uid ?? "",
    locationId: hotel.location?.uid ?? "",
    mealPlanIds: hotel.mealPlans?.map((m) => m.uid) ?? [],
    roomTypeIds: hotel.roomTypes?.map((r) => r.uid) ?? [],
    serviceIds: hotel.services?.map((s) => s.uid) ?? [],
    checkInTime: hotel.checkInTime ?? "",
    checkOutTime: hotel.checkOutTime ?? "",
    childAgeForExtraBed: hotel.childAgeForExtraBed ?? "",
    rateValidFrom: hotel.rateValidFrom ?? "",
    rateValidTo: hotel.rateValidTo ?? "",
    address: hotel.address ?? "",
    contactInfo: hotel.contactInfo ?? "",
    images: hotel.images ?? [],
    amenities: hotel.amenities ?? [],
    status: hotel.status ?? "active",
    notes: hotel.notes ?? "",
  };
}

// Shared Add/Edit Hotel form — used by both the Hotels list page (quick
// create/edit without leaving the table) and the Hotel Details page's Edit
// button, so the two never drift into two different hotel forms.
export function HotelFormModal({
  open,
  hotel,
  onClose,
  onSaved,
  locations,
  escapePoints,
  mealPlans,
  roomTypes,
  services,
}: {
  open: boolean;
  hotel: Hotel | null;
  onClose: () => void;
  onSaved: () => void;
  locations: LibraryLocation[];
  escapePoints: EscapePoint[];
  mealPlans: MealPlan[];
  roomTypes: RoomType[];
  services: Service[];
}) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [original, setOriginal] = useState<FormState | null>(null);
  const [addingLocation, setAddingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState(emptyNewLocation);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  // For the new-location "Country" field below — fetched once regardless of
  // whether "+ Add a new location" is ever opened, same idiom used wherever
  // else this app needs a searchable country list.
  const [countryOptions, setCountryOptions] = useState<ReferenceOption[]>([]);
  useEffect(() => {
    fetchCountryOptions().then(setCountryOptions).catch(() => {});
  }, []);

  // State options for the new-location form are scoped to its selected
  // country — resolve the stored country name back to an ISO code and
  // refetch whenever it changes.
  const newLocationCountryCode = countryOptions.find((c) => c.label === newLocation.country)?.code;
  const [newLocationRegionOptions, setNewLocationRegionOptions] = useState<ReferenceOption[]>([]);
  useEffect(() => {
    if (!newLocationCountryCode) {
      setNewLocationRegionOptions([]);
      return;
    }
    fetchRegionOptions(newLocationCountryCode).then(setNewLocationRegionOptions).catch(() => setNewLocationRegionOptions([]));
  }, [newLocationCountryCode]);

  // The `services` prop is the global master-data list, fetched once at the
  // page level with no hotel context. When editing a real hotel, that hotel
  // may also have its own hotel-scoped services (created via "+ Add
  // Services" below) that only it should ever see — refetch scoped to this
  // hotel's uid so the picker offers global + this hotel's own, matching
  // exactly what its "+ Add Services" flow is allowed to add.
  const [serviceOptions, setServiceOptions] = useState<Service[]>(services);
  const [addingService, setAddingService] = useState(false);
  const [newService, setNewService] = useState({ name: "", description: "" });
  const [savingService, setSavingService] = useState(false);
  const [serviceError, setServiceError] = useState<string | undefined>();

  useEffect(() => {
    if (!open) return;
    const snapshot = snapshotFromHotel(hotel);
    setForm(snapshot);
    setOriginal(
      hotel
        ? {
            ...snapshot,
            mealPlanIds: [...snapshot.mealPlanIds],
            roomTypeIds: [...snapshot.roomTypeIds],
            serviceIds: [...snapshot.serviceIds],
            images: [...snapshot.images],
            amenities: [...snapshot.amenities],
          }
        : null,
    );
    setErrors({});
    setAddingLocation(false);
    setNewLocation(emptyNewLocation);
    setFormError(undefined);
    setServiceOptions(services);
    setAddingService(false);
    setNewService({ name: "", description: "" });
    setServiceError(undefined);
    if (hotel) {
      clientApi
        .get<Service[]>(`/library/services?hotelId=${hotel.uid}`)
        .then((res) => setServiceOptions(res.data))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hotel]);

  async function handleAddService() {
    if (!hotel || !newService.name.trim()) return;
    setSavingService(true);
    setServiceError(undefined);
    try {
      const created = await clientApi
        .post<Service>("/library/services", { name: newService.name, description: newService.description, hotelId: hotel.uid })
        .then((res) => res.data);
      await clientApi.put(`/library/hotels/${hotel.uid}`, {
        serviceIds: [...form.serviceIds, created.uid],
      });
      setServiceOptions((opts) => [...opts, created]);
      update("serviceIds", [...form.serviceIds, created.uid]);
      setNewService({ name: "", description: "" });
      setAddingService(false);
    } catch (err) {
      setServiceError(extractErrorMessage(err, "Failed to add service"));
    } finally {
      setSavingService(false);
    }
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const isDirty = useIsDirty(original, form);
  // Adding a brand-new location while editing is a real change even before
  // `form.locationId` reflects it (that only happens after the location is
  // created, inside handleSubmit below) — don't let the dirty-check block it.
  const canSubmit = !hotel || isDirty || addingLocation;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (hotel && !canSubmit) return;
    setFormError(undefined);

    const nextErrors = validate(form, addingLocation, newLocation);
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
        // call rather than a thunk, same precedent as ConvertToEscapeModal's
        // inline traveller creation.
        const locRes = await clientApi.post<{ uid: string }>("/library/locations", newLocation);
        locationId = locRes.data.uid;
      }

      const payload = {
        name: form.name,
        stars: form.stars ? Number(form.stars) : null,
        locationId,
        escapePointId: form.escapePointId || null,
        mealPlanIds: form.mealPlanIds,
        roomTypeIds: form.roomTypeIds,
        serviceIds: form.serviceIds,
        checkInTime: form.checkInTime || null,
        checkOutTime: form.checkOutTime || null,
        childAgeForExtraBed: form.childAgeForExtraBed,
        rateValidFrom: form.rateValidFrom || null,
        rateValidTo: form.rateValidTo || null,
        address: form.address,
        contactInfo: form.contactInfo,
        images: form.images,
        amenities: form.amenities,
        status: form.status,
        notes: form.notes,
      };

      if (hotel) {
        await dispatch(updateHotel({ uid: hotel.uid, payload })).unwrap();
      } else {
        await dispatch(createHotel(payload)).unwrap();
      }
      dispatch(fetchHotels());
      onSaved();
      onClose();
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save hotel"));
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
      title={hotel ? "Edit hotel" : "Add hotel"}
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
            label="Stars"
            options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} star${n > 1 ? "s" : ""}` }))}
            value={form.stars}
            onChange={(e) => update("stars", e.target.value)}
            placeholder="Select a rating"
          />

          <Select
            label="Escape Point"
            options={escapePoints.map((d) => ({ value: d.uid, label: d.name }))}
            value={form.escapePointId}
            onChange={(e) => update("escapePointId", e.target.value)}
            placeholder="Select an escape point"
          />

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
                {/* Stored/matched by country name, not code — this field held
                    free text before this dropdown, so existing saved values round-trip. */}
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

          <MultiSelect
            label="Meal plans"
            options={mealPlans.map((m) => ({ value: m.uid, label: `${m.code} — ${m.name}` }))}
            value={form.mealPlanIds}
            onChange={(v) => update("mealPlanIds", v)}
          />

          <MultiSelect
            label="Room types"
            options={roomTypes.map((r) => ({ value: r.uid, label: r.name }))}
            value={form.roomTypeIds}
            onChange={(v) => update("roomTypeIds", v)}
          />

          <MultiSelect
            label="Services"
            options={serviceOptions.map((s) => ({ value: s.uid, label: s.name }))}
            value={form.serviceIds}
            onChange={(v) => update("serviceIds", v)}
          />

          {/* Only available once the hotel exists — a hotel-specific service
              needs a real hotel uid to scope itself to (see handleAddService). */}
          {hotel && (
            !addingService ? (
              <button
                type="button"
                onClick={() => setAddingService(true)}
                className="self-start text-sm text-primary hover:underline"
              >
                + Add Services
              </button>
            ) : (
              <div className="flex flex-col gap-3 rounded border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">New service for this hotel</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingService(false);
                      setServiceError(undefined);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
                <TextInput
                  label="Name"
                  placeholder="e.g. Airport Pickup"
                  value={newService.name}
                  onChange={(e) => setNewService((s) => ({ ...s, name: e.target.value }))}
                  required
                />
                <TextInput
                  label="Description"
                  value={newService.description}
                  onChange={(e) => setNewService((s) => ({ ...s, description: e.target.value }))}
                />
                {serviceError && <p className="text-sm text-danger">{serviceError}</p>}
                <Button
                  type="button"
                  size="sm"
                  className="self-start"
                  disabled={savingService || !newService.name.trim()}
                  loading={savingService}
                  loadingText="Saving…"
                  onClick={handleAddService}
                >
                  Add service
                </Button>
              </div>
            )
          )}

          <div className="grid grid-cols-2 gap-3">
            <TimePicker
              label="Check-in time"
              value={form.checkInTime}
              onChange={(v) => update("checkInTime", v)}
            />
            <TimePicker
              label="Check-out time"
              value={form.checkOutTime}
              onChange={(v) => update("checkOutTime", v)}
            />
          </div>

          <TextInput
            label="Child extra-bed age policy"
            placeholder="e.g. 6-12yo"
            value={form.childAgeForExtraBed}
            onChange={(e) => update("childAgeForExtraBed", e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              label="Rate valid from"
              value={form.rateValidFrom}
              onChange={(v) => update("rateValidFrom", v)}
            />
            <DatePicker
              label="Rate valid to"
              value={form.rateValidTo}
              onChange={(v) => update("rateValidTo", v)}
            />
          </div>

          <TextInput label="Address" value={form.address} onChange={(e) => update("address", e.target.value)} />
          <TextInput label="Contact info" value={form.contactInfo} onChange={(e) => update("contactInfo", e.target.value)} />

          <MultiSelect label="Amenities" options={AMENITY_OPTIONS} value={form.amenities} onChange={(v) => update("amenities", v)} />

          <FileUpload label="Images" value={form.images} onChange={(images) => update("images", images)} />

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
          <Button type="submit" disabled={saving || (!!hotel && !canSubmit)} loading={saving} loadingText="Saving…">
            Save hotel
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
