"use client";

import { getOrgCurrency } from "@/lib/currency";
import { PriceCurrencySelect } from "@/components/library/PriceCurrencySelect";
import { useEffect, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { FaRegTrashCan } from "react-icons/fa6";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { TimePicker } from "@/components/ui/TimePicker";
import { Select } from "@/components/ui/Select";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { MultiSelectSearch } from "@/components/ui/MultiSelectSearch";
import { Modal } from "@/components/ui/Modal";
import { FileUpload } from "@/components/ui/FileUpload";
import { Alert } from "@/components/ui/Alert";
import type { Hotel } from "@/lib/hotels";
import type { LibraryLocation } from "@/lib/locations";
import type { EscapePoint } from "@/lib/escape-points";
import type { MealPlan } from "@/lib/meal-plans";
import type { RoomType } from "@/lib/room-types";
import type { Service } from "@/lib/services";
import type { Amenity } from "@/lib/amenities";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useIsDirty } from "@/lib/forms";
import { required, requiredSelection, runValidators, emailField, countryCodeField, mobileField } from "@/lib/validators";
import { fetchCountryOptions, fetchRegionOptions } from "@/lib/reference-data-client";
import type { ReferenceOption } from "@/lib/reference-data-client";
import { useAppDispatch } from "@/store/hooks";
import { createHotel, updateHotel, fetchHotels } from "@/features/hotels/hotelsThunks";

// Dynamically imported (TipTap/ProseMirror add ~90KB) so pages that never
// open this form don't pay for it on first load.
const RichTextEditor = dynamic(() => import("@/components/ui/RichTextEditor").then((m) => m.RichTextEditor), {
  ssr: false,
  loading: () => <div className="skeleton h-40 rounded border border-border" />,
});

// One repeatable "Room Types" row: a room type selection paired with this
// hotel's own price/night for it — kept as a string in form state (same
// convention as basePrice) and coerced to a number only on submit.
type RoomTypePricingRow = { roomTypeId: string; price: string };

const emptyForm = {
  name: "",
  stars: "",
  escapePointId: "",
  locationId: "",
  mealPlanIds: [] as string[],
  priceCurrency: "",
  roomTypePricing: [] as RoomTypePricingRow[],
  serviceIds: [] as string[],
  checkInTime: "",
  checkOutTime: "",
  childAgeForExtraBed: "",
  rateValidFrom: "",
  rateValidTo: "",
  address: "",
  phoneNumber: "",
  email: "",
  images: [] as string[],
  amenities: [] as string[],
  status: "active",
  notes: "",
  about: "",
  rulesAndPolicies: "",
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

  const emailErr = runValidators(v.email, [emailField()]);
  if (emailErr) errors.email = emailErr;

  const phoneErr = runValidators(v.phoneNumber, [countryCodeField(), mobileField()]); // optional, format-checked only if filled
  if (phoneErr) errors.phoneNumber = phoneErr;

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
    priceCurrency: hotel.priceCurrency ?? "",
    roomTypePricing: hotel.roomTypes?.map((r) => ({
      roomTypeId: r.roomTypeId,
      price: r.price != null ? String(r.price) : "",
    })) ?? [],
    serviceIds: hotel.services?.map((s) => s.uid) ?? [],
    checkInTime: hotel.checkInTime ?? "",
    checkOutTime: hotel.checkOutTime ?? "",
    childAgeForExtraBed: hotel.childAgeForExtraBed ?? "",
    rateValidFrom: hotel.rateValidFrom ?? "",
    rateValidTo: hotel.rateValidTo ?? "",
    address: hotel.address ?? "",
    phoneNumber: hotel.phoneNumber ?? "",
    email: hotel.email ?? "",
    images: hotel.images ?? [],
    amenities: hotel.amenities ?? [],
    status: hotel.status ?? "active",
    notes: hotel.notes ?? "",
    about: hotel.about ?? "",
    rulesAndPolicies: hotel.rulesAndPolicies ?? "",
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
  amenities,
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
  amenities: Amenity[];
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
    fetchCountryOptions().then(setCountryOptions).catch(() => { });
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
  // exactly what its "+ Add Services" flow is allowed to add. While adding a
  // brand-new hotel (no uid yet), a service created here has nothing to
  // scope to and is saved as global master data instead — same as Meal
  // Plans/Room Types/Amenities below.
  const [serviceOptions, setServiceOptions] = useState<Service[]>(services);
  const [addingService, setAddingService] = useState(false);
  const [newService, setNewService] = useState({ name: "", description: "", price: "" });
  const [savingService, setSavingService] = useState(false);
  const [serviceError, setServiceError] = useState<string | undefined>();

  // Meal Plans and Room Types are always global master data (no per-hotel
  // scoping concept exists for either — unlike Service, neither entity has
  // a hotel FK), so "+ Add Meals"/"+ Add Room types" work identically in
  // both Add Hotel and Edit Hotel, mirroring Amenities' pattern below.
  const [mealPlanOptions, setMealPlanOptions] = useState<MealPlan[]>(mealPlans);
  const [addingMealPlan, setAddingMealPlan] = useState(false);
  const [newMealPlan, setNewMealPlan] = useState({ code: "", name: "", description: "" });
  const [savingMealPlan, setSavingMealPlan] = useState(false);
  const [mealPlanError, setMealPlanError] = useState<string | undefined>();

  const [roomTypeOptions, setRoomTypeOptions] = useState<RoomType[]>(roomTypes);
  const [addingRoomType, setAddingRoomType] = useState(false);
  const [newRoomType, setNewRoomType] = useState({ name: "", description: "" });
  const [savingRoomType, setSavingRoomType] = useState(false);
  const [roomTypeError, setRoomTypeError] = useState<string | undefined>();

  // Amenities are always global (unlike Services, a newly-added one is
  // immediately reusable by every hotel) — seeded from the page-level prop,
  // with newly-created ones appended locally so they're selectable right
  // away without waiting on a refetch.
  const [amenityOptions, setAmenityOptions] = useState<Amenity[]>(amenities);

  useEffect(() => {
    if (!open) return;
    const snapshot = snapshotFromHotel(hotel);
    setForm(snapshot);
    setOriginal(
      hotel
        ? {
          ...snapshot,
          mealPlanIds: [...snapshot.mealPlanIds],
          roomTypePricing: snapshot.roomTypePricing.map((r) => ({ ...r })),
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
    setNewService({ name: "", description: "", price: "" });
    setServiceError(undefined);
    setMealPlanOptions(mealPlans);
    setAddingMealPlan(false);
    setNewMealPlan({ code: "", name: "", description: "" });
    setMealPlanError(undefined);
    setRoomTypeOptions(roomTypes);
    setAddingRoomType(false);
    setNewRoomType({ name: "", description: "" });
    setRoomTypeError(undefined);
    setAmenityOptions(amenities);
    if (hotel) {
      clientApi
        .get<Service[]>(`/library/services?hotelId=${hotel.uid}`)
        .then((res) => setServiceOptions(res.data))
        .catch(() => { });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hotel]);

  async function handleCreateAmenity(name: string) {
    const created = await clientApi
      .post<Amenity>("/library/amenities", { name })
      .then((res) => res.data)
      .catch((err) => {
        throw new Error(extractErrorMessage(err, "Failed to add amenity"));
      });
    setAmenityOptions((opts) => [...opts, created]);
    return { value: created.name, label: created.name };
  }

  async function handleAddService() {
    if (!newService.name.trim()) return;
    setSavingService(true);
    setServiceError(undefined);
    try {
      const created = await clientApi
        .post<Service>("/library/services", {
          name: newService.name,
          description: newService.description,
          price: newService.price ? Number(newService.price) : null,
          ...(hotel ? { hotelId: hotel.uid } : {}),
        })
        .then((res) => res.data);
      // While editing an existing hotel, also select the new (hotel-scoped)
      // service on it immediately — a brand-new hotel has no uid yet to PUT
      // against, so the global service created above is simply left
      // selectable via serviceIds below, same as any other option.
      if (hotel) {
        await clientApi.put(`/library/hotels/${hotel.uid}`, {
          serviceIds: [...form.serviceIds, created.uid],
        });
      }
      setServiceOptions((opts) => [...opts, created]);
      update("serviceIds", [...form.serviceIds, created.uid]);
      setNewService({ name: "", description: "", price: "" });
      setAddingService(false);
    } catch (err) {
      setServiceError(extractErrorMessage(err, "Failed to add service"));
    } finally {
      setSavingService(false);
    }
  }

  async function handleAddMealPlan() {
    if (!newMealPlan.code.trim() || !newMealPlan.name.trim()) return;
    setSavingMealPlan(true);
    setMealPlanError(undefined);
    try {
      const created = await clientApi
        .post<MealPlan>("/library/meal-plans", {
          code: newMealPlan.code,
          name: newMealPlan.name,
          description: newMealPlan.description,
        })
        .then((res) => res.data);
      setMealPlanOptions((opts) => [...opts, created]);
      update("mealPlanIds", [...form.mealPlanIds, created.uid]);
      setNewMealPlan({ code: "", name: "", description: "" });
      setAddingMealPlan(false);
    } catch (err) {
      setMealPlanError(extractErrorMessage(err, "Failed to add meal plan"));
    } finally {
      setSavingMealPlan(false);
    }
  }

  async function handleAddRoomType() {
    if (!newRoomType.name.trim()) return;
    setSavingRoomType(true);
    setRoomTypeError(undefined);
    try {
      const created = await clientApi
        .post<RoomType>("/library/room-types", { name: newRoomType.name, description: newRoomType.description })
        .then((res) => res.data);
      setRoomTypeOptions((opts) => [...opts, created]);
      // Immediately add it as a new priced row, same "select it right away"
      // UX the old MultiSelectSearch-based flow had.
      update("roomTypePricing", [...form.roomTypePricing, { roomTypeId: created.uid, price: "" }]);
      setNewRoomType({ name: "", description: "" });
      setAddingRoomType(false);
    } catch (err) {
      setRoomTypeError(extractErrorMessage(err, "Failed to add room type"));
    } finally {
      setSavingRoomType(false);
    }
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addRoomTypeRow() {
    setForm((f) => ({ ...f, roomTypePricing: [...f.roomTypePricing, { roomTypeId: "", price: "" }] }));
  }

  function updateRoomTypeRow(index: number, patch: Partial<RoomTypePricingRow>) {
    setForm((f) => ({
      ...f,
      roomTypePricing: f.roomTypePricing.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  }

  function removeRoomTypeRow(index: number) {
    setForm((f) => ({ ...f, roomTypePricing: f.roomTypePricing.filter((_, i) => i !== index) }));
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
        // Drop any row still awaiting a room-type selection (an empty
        // roomTypeId would fail UUID parsing server-side) — every kept row
        // sends its price as a number, or null if left blank.
        priceCurrency: form.priceCurrency || getOrgCurrency(),
        roomTypePricing: form.roomTypePricing
          .filter((r) => r.roomTypeId)
          .map((r) => ({ roomTypeId: r.roomTypeId, price: r.price ? Number(r.price) : null })),
        serviceIds: form.serviceIds,
        checkInTime: form.checkInTime || null,
        checkOutTime: form.checkOutTime || null,
        childAgeForExtraBed: form.childAgeForExtraBed,
        rateValidFrom: form.rateValidFrom || null,
        rateValidTo: form.rateValidTo || null,
        address: form.address,
        phoneNumber: form.phoneNumber,
        email: form.email,
        images: form.images,
        amenities: form.amenities,
        status: form.status,
        notes: form.notes,
        about: form.about,
        rulesAndPolicies: form.rulesAndPolicies,
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
      title={hotel ? "Edit Hotel" : "Add Hotel"}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <fieldset disabled={saving} className="contents">
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <Select
            label="Escape Point"
            options={escapePoints.map((d) => ({ value: d.uid, label: d.name }))}
            value={form.escapePointId}
            onChange={(e) => update("escapePointId", e.target.value)}
            placeholder="Select an escape point"
            searchable
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
                searchable
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

          <TextInput label="Address" value={form.address} onChange={(e) => update("address", e.target.value)} />

          <div className="grid grid-cols-2 gap-3">
            <PhoneInput
              label="Phone Number"
              value={form.phoneNumber}
              onChange={(v) => {
                update("phoneNumber", v);
                setErrors((p) => ({ ...p, phoneNumber: "" }));
              }}
              error={errors.phoneNumber}
            />
            <TextInput
              label="Email"
              type="email"
              placeholder="e.g. reservations@hotel.com"
              value={form.email}
              onChange={(e) => {
                update("email", e.target.value);
                setErrors((p) => ({ ...p, email: "" }));
              }}
              error={errors.email}
            />
          </div>

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

          <div className="flex flex-col gap-1.5">
            <MultiSelectSearch
              label="Meal plans"
              placeholder="Search available meal plans"
              options={mealPlanOptions.map((m) => ({ value: m.uid, label: `${m.code} — ${m.name}` }))}
              value={form.mealPlanIds}
              onChange={(v) => update("mealPlanIds", v)}
            />
            {!addingMealPlan ? (
              <button
                type="button"
                onClick={() => setAddingMealPlan(true)}
                className="self-start text-sm text-primary hover:underline"
              >
                + Add New Meals
              </button>
            ) : (
              <div className="flex flex-col gap-3 rounded border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">New meal plan</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingMealPlan(false);
                      setMealPlanError(undefined);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TextInput
                    label="Code"
                    placeholder="e.g. CP"
                    value={newMealPlan.code}
                    onChange={(e) => setNewMealPlan((m) => ({ ...m, code: e.target.value }))}
                    required
                  />
                  <TextInput
                    label="Name"
                    placeholder="e.g. Continental Plan"
                    value={newMealPlan.name}
                    onChange={(e) => setNewMealPlan((m) => ({ ...m, name: e.target.value }))}
                    required
                  />
                </div>
                <TextInput
                  label="Description"
                  value={newMealPlan.description}
                  onChange={(e) => setNewMealPlan((m) => ({ ...m, description: e.target.value }))}
                />
                {mealPlanError && <p className="text-sm text-danger">{mealPlanError}</p>}
                <Button
                  type="button"
                  size="sm"
                  className="self-start"
                  disabled={savingMealPlan || !newMealPlan.code.trim() || !newMealPlan.name.trim()}
                  loading={savingMealPlan}
                  loadingText="Saving…"
                  onClick={handleAddMealPlan}
                >
                  Add meal plan
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <PriceCurrencySelect value={form.priceCurrency} onChange={(code) => update("priceCurrency", code)} />
            <span className="text-sm font-medium text-foreground">Room Types</span>

            {form.roomTypePricing.length > 0 && (
              <div className="flex flex-col gap-2">
                {form.roomTypePricing.map((row, index) => {
                  // A room type already picked in another row can't be
                  // picked again here — but stays in THIS row's own list so
                  // its label keeps rendering once selected.
                  const takenElsewhere = new Set(
                    form.roomTypePricing.filter((_, i) => i !== index).map((r) => r.roomTypeId),
                  );
                  const rowOptions = roomTypeOptions.filter(
                    (rt) => rt.uid === row.roomTypeId || !takenElsewhere.has(rt.uid),
                  );
                  return (
                    <div key={index} className="flex items-end gap-2 rounded-lg border border-border bg-muted/20 p-2.5">
                      <div className="flex-1">
                        <Select
                          label="Room Type"
                          options={rowOptions.map((rt) => ({ value: rt.uid, label: rt.name }))}
                          value={row.roomTypeId}
                          onChange={(e) => updateRoomTypeRow(index, { roomTypeId: e.target.value })}
                          placeholder="Select a room type"
                          searchable
                        />
                      </div>
                      <div className="w-36 shrink-0">
                        <TextInput
                          label="Price / Night"
                          type="number"
                          min={0}
                          step="any"
                          placeholder="e.g. 8000"
                          value={row.price}
                          onChange={(e) => updateRoomTypeRow(index, { price: e.target.value })}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRoomTypeRow(index)}
                        className="mb-2 shrink-0 rounded-full p-2 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                        aria-label="Remove room type"
                        title="Remove room type"
                      >
                        <FaRegTrashCan size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <button type="button" onClick={addRoomTypeRow} className="self-start text-sm text-primary hover:underline">
              + Add Room Type
            </button>

            {!addingRoomType ? (
              <button
                type="button"
                onClick={() => setAddingRoomType(true)}
                className="self-start text-sm text-primary hover:underline"
              >
                + Create a new room type
              </button>
            ) : (
              <div className="flex flex-col gap-3 rounded border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">New room type</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingRoomType(false);
                      setRoomTypeError(undefined);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
                <TextInput
                  label="Name"
                  placeholder="e.g. Deluxe Room"
                  value={newRoomType.name}
                  onChange={(e) => setNewRoomType((r) => ({ ...r, name: e.target.value }))}
                  required
                />
                <TextInput
                  label="Description"
                  value={newRoomType.description}
                  onChange={(e) => setNewRoomType((r) => ({ ...r, description: e.target.value }))}
                />
                {roomTypeError && <p className="text-sm text-danger">{roomTypeError}</p>}
                <Button
                  type="button"
                  size="sm"
                  className="self-start"
                  disabled={savingRoomType || !newRoomType.name.trim()}
                  loading={savingRoomType}
                  loadingText="Saving…"
                  onClick={handleAddRoomType}
                >
                  Add room type
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <MultiSelectSearch
              label="Services"
              placeholder="Search available services"
              options={serviceOptions.map((s) => ({ value: s.uid, label: s.name }))}
              value={form.serviceIds}
              onChange={(v) => update("serviceIds", v)}
            />
            {!addingService ? (
              <button
                type="button"
                onClick={() => setAddingService(true)}
                className="self-start text-sm text-primary hover:underline"
              >
                + Add New Services
              </button>
            ) : (
              <div className="flex flex-col gap-3 rounded border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {hotel ? "New service for this hotel" : "New service"}
                  </span>
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
                <TextInput
                  label={`Price (${form.priceCurrency || getOrgCurrency()})`}
                  type="number"
                  min={0}
                  step="any"
                  value={newService.price}
                  onChange={(e) => setNewService((s) => ({ ...s, price: e.target.value }))}
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
            )}
          </div>

          <MultiSelectSearch
            label="Amenities"
            placeholder="Search amenities…"
            options={amenityOptions.map((a) => ({ value: a.name, label: a.name }))}
            value={form.amenities}
            onChange={(v) => update("amenities", v)}
            onCreateOption={handleCreateAmenity}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="hotel-about" className="text-sm font-medium text-foreground">
              About
            </label>
            <textarea
              id="hotel-about"
              value={form.about}
              onChange={(e) => update("about", e.target.value)}
              rows={4}
              placeholder="A short description of the hotel"
              className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
            />
          </div>

          <RichTextEditor
            label="Rules and Policies"
            value={form.rulesAndPolicies}
            onChange={(html) => update("rulesAndPolicies", html)}
            placeholder="Check-in rules, cancellation policy, house rules…"
          />

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

        <div className="flex gap-3 w-full border-t pt-5">
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={onClose}
            className="w-full"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving || (!!hotel && !canSubmit)} loading={saving} loadingText="Saving…" className="w-full">
            Save Hotel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
