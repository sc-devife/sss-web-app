"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { FileUpload } from "@/components/ui/FileUpload";
import { BulkImportModal } from "@/components/library/BulkImportModal";
import { Alert } from "@/components/ui/Alert";
import { Body } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import type { Hotel } from "@/lib/hotels";
import type { LibraryLocation } from "@/lib/locations";
import type { EscapePoint } from "@/lib/escape-points";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useIsDirty } from "@/lib/forms";
import { required, requiredSelection, runValidators } from "@/lib/validators";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchHotels, createHotel, updateHotel, deleteHotel } from "@/features/hotels/hotelsThunks";
import { selectHotels, selectHotelsStatus, selectHotelsError } from "@/features/hotels/hotelsSelectors";
import { FaPlus } from "react-icons/fa";
import { LuImport } from "react-icons/lu";

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
}: {
  locations: LibraryLocation[];
  escapePoints: EscapePoint[];
}) {
  const dispatch = useAppDispatch();
  const hotels = useAppSelector(selectHotels);
  const status = useAppSelector(selectHotelsStatus);
  const error = useAppSelector(selectHotelsError);

  const [modalOpen, setModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
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
      address: hotel.address ?? "",
      contactInfo: hotel.contactInfo ?? "",
      images: hotel.images ?? [],
      amenities: hotel.amenities ?? [],
      status: hotel.status ?? "active",
    };
    setEditing(hotel);
    setForm(snapshot);
    setOriginal({ ...snapshot, images: [...snapshot.images], amenities: [...snapshot.amenities] });
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
          actions={(h) => (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => openEdit(h)}>Edit</Button>
              <Button variant="danger" size="sm" disabled={deletingUid === h.uid} onClick={() => handleDelete(h)}>Archive</Button>
            </div>
          )}
        />
      )}

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
