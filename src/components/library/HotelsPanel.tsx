"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { TimePicker } from "@/components/ui/TimePicker";
import { Select } from "@/components/ui/Select";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { FileUpload } from "@/components/ui/FileUpload";
import { BulkImportModal } from "@/components/library/BulkImportModal";
import { Alert } from "@/components/ui/Alert";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { resolveFileUrl } from "@/lib/files";
import type { Hotel } from "@/lib/hotels";
import type { LibraryLocation } from "@/lib/locations";
import type { EscapePoint } from "@/lib/escape-points";
import type { MealPlan } from "@/lib/meal-plans";
import type { RoomType } from "@/lib/room-types";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useIsDirty } from "@/lib/forms";
import { required, requiredSelection, runValidators } from "@/lib/validators";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchHotels, createHotel, updateHotel, deleteHotel } from "@/features/hotels/hotelsThunks";
import { formatDisplayDate, formatDisplayTime } from "@/lib/date";
import { selectHotels, selectHotelsStatus, selectHotelsError } from "@/features/hotels/hotelsSelectors";
import { FaPlus } from "react-icons/fa";
import { LuImport } from "react-icons/lu";
import { FaLocationDot } from "react-icons/fa6";
import { CiImageOff } from "react-icons/ci";

const AMENITY_OPTIONS = [
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

export function HotelsPanel({
  locations,
  escapePoints,
  mealPlans,
  roomTypes,
}: {
  locations: LibraryLocation[];
  escapePoints: EscapePoint[];
  mealPlans: MealPlan[];
  roomTypes: RoomType[];
}) {
  const dispatch = useAppDispatch();
  const hotels = useAppSelector(selectHotels);
  const status = useAppSelector(selectHotelsStatus);
  const error = useAppSelector(selectHotelsError);

  const [modalOpen, setModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [viewing, setViewing] = useState<Hotel | null>(null);
  const [editing, setEditing] = useState<Hotel | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [addingLocation, setAddingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState(emptyNewLocation);
  const [original, setOriginal] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | undefined>();

  useEffect(() => {
    dispatch(fetchHotels());
  }, [dispatch]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOriginal(null);
    setErrors({});
    setAddingLocation(false);
    setNewLocation(emptyNewLocation);
    setFormError(undefined);
    setModalOpen(true);
  }

  function openEdit(hotel: Hotel) {
    const snapshot: FormState = {
      name: hotel.name,
      stars: hotel.stars ? String(hotel.stars) : "",
      escapePointId: hotel.escapePoint?.uid ?? "",
      locationId: hotel.location?.uid ?? "",
      mealPlanIds: hotel.mealPlans?.map((m) => m.uid) ?? [],
      roomTypeIds: hotel.roomTypes?.map((r) => r.uid) ?? [],
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
    };
    setEditing(hotel);
    setForm(snapshot);
    setOriginal({
      ...snapshot,
      mealPlanIds: [...snapshot.mealPlanIds],
      roomTypeIds: [...snapshot.roomTypeIds],
      images: [...snapshot.images],
      amenities: [...snapshot.amenities],
    });
    setErrors({});
    setAddingLocation(false);
    setNewLocation(emptyNewLocation);
    setFormError(undefined);
    setModalOpen(true);
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
      };

      if (editing) {
        await dispatch(updateHotel({ uid: editing.uid, payload })).unwrap();
      } else {
        await dispatch(createHotel(payload)).unwrap();
      }
      dispatch(fetchHotels());
      setModalOpen(false);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save hotel"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(hotel: Hotel) {
    setDeletingUid(hotel.uid);
    try {
      await dispatch(deleteHotel(hotel.uid));
      dispatch(fetchHotels());
    } finally {
      setDeletingUid(null);
    }
  }

  const columns: DataTableColumn<Hotel>[] = [
    {
      key: "name",
      header: "Name",
      render: (h) => h.name,
      sortValue: (h) => h.name.toLowerCase(),
      filterValue: (h) => h.name,
    },
    {
      key: "stars",
      header: "Stars",
      render: (h) => (h.stars ? "★".repeat(h.stars) : "—"),
      sortValue: (h) => h.stars ?? 0,
    },
    {
      key: "escapePoint",
      header: "Escape Point",
      render: (h) => h.escapePoint?.name ?? "—",
      filterValue: (h) => h.escapePoint?.name ?? "",
    },
    {
      key: "location",
      header: "Location",
      render: (h) => h.location?.displayName ?? "—",
      filterValue: (h) => h.location?.displayName ?? "",
    },
    {
      key: "mealPlans",
      header: "Meal Plans",
      render: (h) => (h.mealPlans && h.mealPlans.length > 0 ? h.mealPlans.map((m) => m.code).join(" · ") : "—"),
    },
    {
      key: "checkInOut",
      header: "Check-in / Check-out",
      render: (h) => (h.checkInTime || h.checkOutTime ? `${h.checkInTime ?? "—"} / ${h.checkOutTime ?? "—"}` : "—"),
    },
    {
      key: "rateValidity",
      header: "Rate Valid",
      render: (h) =>
        h.rateValidFrom || h.rateValidTo
          ? `${formatDisplayDate(h.rateValidFrom) ?? "—"} to ${formatDisplayDate(h.rateValidTo) ?? "—"}`
          : "—",
    },
    {
      key: "status",
      header: "Status",
      render: (h) => <Badge tone={h.status === "archived" ? "danger" : "success"}>{h.status ?? "active"}</Badge>,
      sortValue: (h) => h.status ?? "",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 justify-end">
        <Button className="self-start" onClick={openCreate}><FaPlus />Add hotel</Button>
        <Button variant="secondary" className="self-start" onClick={() => setBulkImportOpen(true)}><LuImport size={18} />Bulk import</Button>
      </div>

      {bulkImportOpen && (
        <BulkImportModal
          entityType="hotels"
          label="hotels"
          onClose={() => setBulkImportOpen(false)}
          onImported={() => dispatch(fetchHotels())}
        />
      )}

      {status === "loading" && hotels.length === 0 ? (
        <LoadingState label="Loading hotels…" />
      ) : status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <DataTable
          columns={columns}
          rows={hotels}
          rowKey={(h) => h.uid}
          searchPlaceholder="Search hotels…"
          emptyMessage="No hotels yet — add your first one."
          onRowClick={(h) => setViewing(h)}
          getRowLabel={(h) => h.name}
          rowMenuActions={(h) => [
            { key: "edit", label: "Edit", onSelect: () => openEdit(h) },
            { key: "archive", label: "Archive", tone: "danger", disabled: deletingUid === h.uid, onSelect: () => handleDelete(h) },
          ]}
        />
      )}

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.name ?? "Hotel"}>
        {viewing && (
          <div className="flex max-h-[65vh] flex-col">
            <div className="overflow-y-auto pr-1">
              {viewing.images && viewing.images.length > 0 ? (
                <div className="relative overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveFileUrl(viewing.images[0])}
                    alt={viewing.name}
                    className="h-56 w-full object-cover"
                  />
                  {viewing.images.length > 1 && (
                    <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      {viewing.images.length} images
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/30">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CiImageOff size={22} />
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">No image available</div>
                </div>
              )}

              <div className="mt-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">{viewing.name}</h2>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Hotel</span>
                    {viewing.stars != null && (
                      <>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="text-sm text-muted-foreground">{"★".repeat(viewing.stars)}</span>
                      </>
                    )}
                  </div>
                </div>
                <Badge tone={viewing.status === "archived" ? "danger" : "success"}>{viewing.status ?? "active"}</Badge>
              </div>

              <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-muted-foreground"><FaLocationDot /></span>
                  <Body className="font-medium">{viewing.location?.displayName || "No location available"}</Body>
                </div>
                {viewing.escapePoint && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone="neutral">{viewing.escapePoint.name}</Badge>
                  </div>
                )}
              </div>

              {(viewing.mealPlans && viewing.mealPlans.length > 0) || (viewing.roomTypes && viewing.roomTypes.length > 0) ? (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {viewing.mealPlans && viewing.mealPlans.length > 0 && (
                    <div>
                      <Caption>Meal Plans</Caption>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {viewing.mealPlans.map((m) => (
                          <Badge key={m.uid} tone="neutral">{m.code}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {viewing.roomTypes && viewing.roomTypes.length > 0 && (
                    <div>
                      <Caption>Room Types</Caption>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {viewing.roomTypes.map((r) => (
                          <Badge key={r.uid} tone="neutral">{r.name}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              <div className="mt-4">
                <Caption>Details</Caption>
                <div className="mt-1 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-background p-3">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Check-in</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">{formatDisplayTime(viewing.checkInTime) || "—"}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Check-out</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">{formatDisplayTime(viewing.checkOutTime) || "—"}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rate Valid</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">
                      {viewing.rateValidFrom || viewing.rateValidTo
                        ? `${formatDisplayDate(viewing.rateValidFrom) ?? "—"} to ${formatDisplayDate(viewing.rateValidTo) ?? "—"}`
                        : "—"}
                    </div>
                  </div>
                  {viewing.childAgeForExtraBed && (
                    <div className="rounded-xl border border-border bg-background p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Child Extra-bed Age</div>
                      <div className="mt-1 text-sm font-semibold text-foreground">{viewing.childAgeForExtraBed}</div>
                    </div>
                  )}
                  {viewing.address && (
                    <div className="rounded-xl border border-border bg-background p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Address</div>
                      <div className="mt-1 text-sm font-semibold text-foreground">{viewing.address}</div>
                    </div>
                  )}
                  {viewing.contactInfo && (
                    <div className="rounded-xl border border-border bg-background p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contact Info</div>
                      <div className="mt-1 text-sm font-semibold text-foreground">{viewing.contactInfo}</div>
                    </div>
                  )}
                </div>
              </div>

              {viewing.amenities && viewing.amenities.length > 0 && (
                <div className="mt-4">
                  <Caption>Amenities</Caption>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {viewing.amenities.map((a) => (
                      <Badge key={a} tone="neutral">
                        {AMENITY_OPTIONS.find((o) => o.value === a)?.label ?? a}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {viewing.images && viewing.images.length > 1 && (
                <div className="mt-4">
                  <Caption>Gallery</Caption>
                  <div className="mt-1 grid grid-cols-4 gap-2">
                    {viewing.images.map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={url}
                        src={resolveFileUrl(url)}
                        alt={viewing.name}
                        className="aspect-square w-full rounded-lg border border-border object-cover transition-transform hover:scale-[1.02]"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex shrink-0 justify-end gap-2 border-t border-border pt-4">
              <Button variant="secondary" onClick={() => setViewing(null)}>Close</Button>
              <Button
                onClick={() => {
                  const hotel = viewing;
                  setViewing(null);
                  openEdit(hotel);
                }}
              >
                Edit
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={modalOpen}
        onClose={() => {
          if (saving) return;
          setModalOpen(false);
        }}
        title={editing ? "Edit hotel" : "Add hotel"}
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
                  <TextInput label="State" value={newLocation.state} onChange={(e) => setNewLocation((l) => ({ ...l, state: e.target.value }))} />
                  <TextInput label="Country" value={newLocation.country} onChange={(e) => setNewLocation((l) => ({ ...l, country: e.target.value }))} />
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
            <Button type="submit" disabled={saving || (!!editing && !canSubmit)} loading={saving} loadingText="Saving…">
              Save hotel
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
