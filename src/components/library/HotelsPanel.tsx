"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { FileUpload } from "@/components/ui/FileUpload";
import { BulkImportModal } from "@/components/library/BulkImportModal";
import type { Hotel } from "@/lib/hotels";
import type { LibraryLocation } from "@/lib/locations";
import type { Destination } from "@/lib/destinations";

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
  destinationId: "",
  locationId: "",
  address: "",
  contactInfo: "",
  images: [] as string[],
  amenities: [] as string[],
  status: "active",
};

type FormState = typeof emptyForm;

const emptyNewLocation = { city: "", state: "", country: "", displayName: "" };

export function HotelsPanel({
  initialHotels,
  locations,
  destinations,
}: {
  initialHotels: Hotel[];
  locations: LibraryLocation[];
  destinations: Destination[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [editing, setEditing] = useState<Hotel | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [addingLocation, setAddingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState(emptyNewLocation);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setAddingLocation(false);
    setNewLocation(emptyNewLocation);
    setError(undefined);
    setModalOpen(true);
  }

  function openEdit(hotel: Hotel) {
    setEditing(hotel);
    setForm({
      name: hotel.name,
      stars: hotel.stars ? String(hotel.stars) : "",
      destinationId: hotel.destination?.uid ?? "",
      locationId: hotel.location?.uid ?? "",
      address: hotel.address ?? "",
      contactInfo: hotel.contactInfo ?? "",
      images: hotel.images ?? [],
      amenities: hotel.amenities ?? [],
      status: hotel.status ?? "active",
    });
    setAddingLocation(false);
    setNewLocation(emptyNewLocation);
    setError(undefined);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(undefined);
    try {
      let locationId = form.locationId;

      if (addingLocation) {
        if (!newLocation.city.trim() || !newLocation.displayName.trim()) {
          throw new Error("City and display name are required for a new location");
        }
        const locRes = await fetch("/api/library/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newLocation),
        });
        const locBody = await locRes.json().catch(() => null);
        if (!locRes.ok) throw new Error(locBody?.message ?? "Failed to create location");
        locationId = locBody.uid;
      }

      if (!locationId) {
        throw new Error("A location is required");
      }

      const payload = {
        name: form.name,
        stars: form.stars ? Number(form.stars) : null,
        locationId,
        destinationId: form.destinationId || null,
        address: form.address,
        contactInfo: form.contactInfo,
        images: form.images,
        amenities: form.amenities,
        status: form.status,
      };

      const url = editing ? `/api/library/hotels/${editing.uid}` : "/api/library/hotels";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to save hotel");
      }
      setModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save hotel");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(hotel: Hotel) {
    await fetch(`/api/library/hotels/${hotel.uid}`, { method: "DELETE" });
    router.refresh();
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
      key: "destination",
      header: "Destination",
      render: (h) => h.destination?.name ?? "—",
      filterValue: (h) => h.destination?.name ?? "",
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
      <div className="flex gap-2">
        <Button className="self-start" onClick={openCreate}>Add hotel</Button>
        <Button variant="secondary" className="self-start" onClick={() => setBulkImportOpen(true)}>Bulk import</Button>
      </div>

      {bulkImportOpen && (
        <BulkImportModal entityType="hotels" label="hotels" onClose={() => setBulkImportOpen(false)} />
      )}

      <DataTable
        columns={columns}
        rows={initialHotels}
        rowKey={(h) => h.uid}
        searchPlaceholder="Search hotels…"
        emptyMessage="No hotels yet — add your first one."
        actions={(h) => (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => openEdit(h)}>Edit</Button>
            <Button variant="danger" size="sm" onClick={() => handleDelete(h)}>Archive</Button>
          </div>
        )}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit hotel" : "Add hotel"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextInput label="Name" value={form.name} onChange={(e) => update("name", e.target.value)} required />

          <Select
            label="Stars"
            options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} star${n > 1 ? "s" : ""}` }))}
            value={form.stars}
            onChange={(e) => update("stars", e.target.value)}
            placeholder="Select a rating"
          />

          <Select
            label="Destination"
            options={destinations.map((d) => ({ value: d.uid, label: d.name }))}
            value={form.destinationId}
            onChange={(e) => update("destinationId", e.target.value)}
            placeholder="Select a destination"
          />

          {!addingLocation ? (
            <div className="flex flex-col gap-1.5">
              <Select
                label="Location"
                options={locations.map((l) => ({ value: l.uid, label: l.displayName }))}
                value={form.locationId}
                onChange={(e) => update("locationId", e.target.value)}
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
                <TextInput label="City" value={newLocation.city} onChange={(e) => setNewLocation((l) => ({ ...l, city: e.target.value }))} required />
                <TextInput label="State" value={newLocation.state} onChange={(e) => setNewLocation((l) => ({ ...l, state: e.target.value }))} />
                <TextInput label="Country" value={newLocation.country} onChange={(e) => setNewLocation((l) => ({ ...l, country: e.target.value }))} />
                <TextInput
                  label="Display name"
                  value={newLocation.displayName}
                  onChange={(e) => setNewLocation((l) => ({ ...l, displayName: e.target.value }))}
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

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save hotel"}</Button>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
