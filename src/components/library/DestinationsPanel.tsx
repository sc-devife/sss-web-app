"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { FileUpload } from "@/components/ui/FileUpload";
import { BulkImportModal } from "@/components/library/BulkImportModal";
import type { Destination } from "@/lib/destinations";
import type { ReferenceOption } from "@/lib/reference-data";
import { fetchCountryOptions, fetchRegionOptions, fetchCityOptions } from "@/lib/reference-data-client";

const emptyForm = {
  id: "",
  name: "",
  countryCode: "",
  regionCode: "",
  cityCode: "",
  description: "",
  images: [] as string[],
  status: "active",
};

type FormState = typeof emptyForm;

export function DestinationsPanel({ initialDestinations }: { initialDestinations: Destination[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [editing, setEditing] = useState<Destination | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const [countryOptions, setCountryOptions] = useState<ReferenceOption[]>([]);
  const [regionOptions, setRegionOptions] = useState<ReferenceOption[]>([]);
  const [cityOptions, setCityOptions] = useState<ReferenceOption[]>([]);

  useEffect(() => {
    fetchCountryOptions().then(setCountryOptions);
  }, []);

  useEffect(() => {
    fetchRegionOptions(form.countryCode).then(setRegionOptions);
  }, [form.countryCode]);

  useEffect(() => {
    fetchCityOptions(form.countryCode, form.regionCode).then(setCityOptions);
  }, [form.countryCode, form.regionCode]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(undefined);
    setModalOpen(true);
  }

  function openEdit(destination: Destination) {
    setEditing(destination);
    setForm({
      id: destination.id,
      name: destination.name,
      countryCode: destination.countryCode ?? "",
      regionCode: destination.regionCode ?? "",
      cityCode: destination.cityCode ?? "",
      description: destination.description ?? "",
      images: destination.images ?? [],
      status: destination.status ?? "active",
    });
    setError(undefined);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(undefined);
    try {
      const url = editing ? `/api/library/destinations/${editing.uid}` : "/api/library/destinations";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to save destination");
      }
      setModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save destination");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(destination: Destination) {
    await fetch(`/api/library/destinations/${destination.uid}`, { method: "DELETE" });
    router.refresh();
  }

  const columns: DataTableColumn<Destination>[] = [
    {
      key: "name",
      header: "Name",
      render: (d) => d.name,
      sortValue: (d) => d.name.toLowerCase(),
      filterValue: (d) => d.name,
    },
    {
      key: "location",
      header: "Location",
      render: (d) => d.locationLabel || "—",
      filterValue: (d) => d.locationLabel,
    },
    {
      key: "status",
      header: "Status",
      render: (d) => <Badge tone={d.status === "archived" ? "danger" : "success"}>{d.status ?? "active"}</Badge>,
      sortValue: (d) => d.status ?? "",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button className="self-start" onClick={openCreate}>Add destination</Button>
        <Button variant="secondary" className="self-start" onClick={() => setBulkImportOpen(true)}>Bulk import</Button>
      </div>

      {bulkImportOpen && (
        <BulkImportModal entityType="destinations" label="destinations" onClose={() => setBulkImportOpen(false)} />
      )}

      <DataTable
        columns={columns}
        rows={initialDestinations}
        rowKey={(d) => d.uid}
        searchPlaceholder="Search destinations…"
        emptyMessage="No destinations yet — add your first one."
        actions={(d) => (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => openEdit(d)}>Edit</Button>
            <Button variant="danger" size="sm" onClick={() => handleDelete(d)}>Archive</Button>
          </div>
        )}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit destination" : "Add destination"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextInput
            label="Code"
            value={form.id}
            onChange={(e) => update("id", e.target.value)}
            disabled={!!editing}
            required
          />
          <TextInput label="Name" value={form.name} onChange={(e) => update("name", e.target.value)} required />

          <Select
            label="Country"
            options={countryOptions.map((c) => ({ value: c.code, label: c.label }))}
            value={form.countryCode}
            onChange={(e) => { update("countryCode", e.target.value); update("regionCode", ""); update("cityCode", ""); }}
            placeholder="Select a country"
          />
          <Select
            label="Region / State"
            options={regionOptions.map((r) => ({ value: r.code, label: r.label }))}
            value={form.regionCode}
            onChange={(e) => { update("regionCode", e.target.value); update("cityCode", ""); }}
            placeholder="Select a region"
            disabled={!form.countryCode}
          />
          <Select
            label="City"
            options={cityOptions.map((c) => ({ value: c.code, label: c.label }))}
            value={form.cityCode}
            onChange={(e) => update("cityCode", e.target.value)}
            placeholder="Select a city"
            disabled={!form.regionCode}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium text-foreground">Description</label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            />
          </div>

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
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save destination"}</Button>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
