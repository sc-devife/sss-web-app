"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { BulkImportModal } from "@/components/library/BulkImportModal";
import type { ServiceProvider } from "@/lib/service-providers";
import type { ReferenceOption } from "@/lib/reference-data";
import { fetchCountryOptions } from "@/lib/reference-data-client";

const TYPE_OPTIONS = [
  { value: "transport", label: "Transport" },
  { value: "activity", label: "Activity" },
  { value: "guide", label: "Guide" },
  { value: "other", label: "Other" },
];

const emptyForm = {
  name: "",
  typeCode: "transport",
  contactInfo: "",
  countryCode: "",
  status: "active",
};

type FormState = typeof emptyForm;

export function ServiceProvidersPanel({ initialProviders }: { initialProviders: ServiceProvider[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceProvider | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [countryOptions, setCountryOptions] = useState<ReferenceOption[]>([]);

  useEffect(() => {
    fetchCountryOptions().then(setCountryOptions);
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(undefined);
    setModalOpen(true);
  }

  function openEdit(provider: ServiceProvider) {
    setEditing(provider);
    setForm({
      name: provider.name,
      typeCode: provider.typeCode,
      contactInfo: provider.contactInfo ?? "",
      countryCode: provider.countryCode ?? "",
      status: provider.status ?? "active",
    });
    setError(undefined);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(undefined);
    try {
      const url = editing ? `/api/library/service-providers/${editing.uid}` : "/api/library/service-providers";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to save service provider");
      }
      setModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save service provider");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(provider: ServiceProvider) {
    await fetch(`/api/library/service-providers/${provider.uid}`, { method: "DELETE" });
    router.refresh();
  }

  const columns: DataTableColumn<ServiceProvider>[] = [
    {
      key: "name",
      header: "Name",
      render: (p) => p.name,
      sortValue: (p) => p.name.toLowerCase(),
      filterValue: (p) => p.name,
    },
    {
      key: "type",
      header: "Type",
      render: (p) => TYPE_OPTIONS.find((t) => t.value === p.typeCode)?.label ?? p.typeCode,
      sortValue: (p) => p.typeCode,
    },
    {
      key: "country",
      header: "Country",
      render: (p) => p.countryLabel || "—",
      filterValue: (p) => p.countryLabel,
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <Badge tone={p.status === "archived" ? "danger" : "success"}>{p.status ?? "active"}</Badge>,
      sortValue: (p) => p.status ?? "",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button className="self-start" onClick={openCreate}>Add service provider</Button>
        <Button variant="secondary" className="self-start" onClick={() => setBulkImportOpen(true)}>Bulk import</Button>
      </div>

      {bulkImportOpen && (
        <BulkImportModal entityType="service-providers" label="service providers" onClose={() => setBulkImportOpen(false)} />
      )}

      <DataTable
        columns={columns}
        rows={initialProviders}
        rowKey={(p) => p.uid}
        searchPlaceholder="Search service providers…"
        emptyMessage="No service providers yet — add your first one."
        actions={(p) => (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => openEdit(p)}>Edit</Button>
            <Button variant="danger" size="sm" onClick={() => handleDelete(p)}>Archive</Button>
          </div>
        )}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit service provider" : "Add service provider"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextInput label="Name" value={form.name} onChange={(e) => update("name", e.target.value)} required />

          <Select label="Type" options={TYPE_OPTIONS} value={form.typeCode} onChange={(e) => update("typeCode", e.target.value)} />

          <TextInput label="Contact info" value={form.contactInfo} onChange={(e) => update("contactInfo", e.target.value)} />

          <Select
            label="Country"
            options={countryOptions.map((c) => ({ value: c.code, label: c.label }))}
            value={form.countryCode}
            onChange={(e) => update("countryCode", e.target.value)}
            placeholder="Select a country"
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

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save service provider"}</Button>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
