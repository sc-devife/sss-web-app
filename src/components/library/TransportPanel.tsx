"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { BulkImportModal } from "@/components/library/BulkImportModal";
import type { Transport } from "@/lib/transports";
import type { ServiceProvider } from "@/lib/service-providers";

const MODE_OPTIONS = [
  { value: "car", label: "Car" },
  { value: "coach", label: "Coach" },
  { value: "flight", label: "Flight" },
  { value: "train", label: "Train" },
  { value: "boat", label: "Boat" },
];

const emptyForm = {
  modeCode: "car",
  vehicleTypeCode: "",
  capacity: "",
  providerId: "",
  basePrice: "",
  status: "active",
};

type FormState = typeof emptyForm;

export function TransportPanel({
  initialTransports,
  providers,
}: {
  initialTransports: Transport[];
  providers: ServiceProvider[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [editing, setEditing] = useState<Transport | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const transportProviders = providers.filter((p) => p.typeCode === "transport");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(undefined);
    setModalOpen(true);
  }

  function openEdit(transport: Transport) {
    setEditing(transport);
    setForm({
      modeCode: transport.modeCode,
      vehicleTypeCode: transport.vehicleTypeCode ?? "",
      capacity: transport.capacity ? String(transport.capacity) : "",
      providerId: transport.provider?.uid ?? "",
      basePrice: transport.basePrice != null ? String(transport.basePrice) : "",
      status: transport.status ?? "active",
    });
    setError(undefined);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(undefined);
    try {
      const payload = {
        modeCode: form.modeCode,
        vehicleTypeCode: form.vehicleTypeCode || null,
        capacity: form.capacity ? Number(form.capacity) : null,
        providerId: form.providerId || null,
        basePrice: form.basePrice ? Number(form.basePrice) : null,
        status: form.status,
      };
      const url = editing ? `/api/library/transports/${editing.uid}` : "/api/library/transports";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to save transport");
      }
      setModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save transport");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(transport: Transport) {
    await fetch(`/api/library/transports/${transport.uid}`, { method: "DELETE" });
    router.refresh();
  }

  const columns: DataTableColumn<Transport>[] = [
    {
      key: "mode",
      header: "Mode",
      render: (t) => MODE_OPTIONS.find((m) => m.value === t.modeCode)?.label ?? t.modeCode,
      sortValue: (t) => t.modeCode,
    },
    {
      key: "vehicleType",
      header: "Vehicle type",
      render: (t) => t.vehicleTypeCode ?? "—",
    },
    {
      key: "capacity",
      header: "Capacity",
      render: (t) => t.capacity ?? "—",
      sortValue: (t) => t.capacity ?? 0,
    },
    {
      key: "provider",
      header: "Provider",
      render: (t) => t.provider?.name ?? "—",
      filterValue: (t) => t.provider?.name ?? "",
    },
    {
      key: "basePrice",
      header: "Base price (USD)",
      render: (t) => (t.basePrice != null ? `$${t.basePrice.toFixed(2)}` : "—"),
      sortValue: (t) => t.basePrice ?? 0,
    },
    {
      key: "status",
      header: "Status",
      render: (t) => <Badge tone={t.status === "archived" ? "danger" : "success"}>{t.status ?? "active"}</Badge>,
      sortValue: (t) => t.status ?? "",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button className="self-start" onClick={openCreate}>Add transport</Button>
        <Button variant="secondary" className="self-start" onClick={() => setBulkImportOpen(true)}>Bulk import</Button>
      </div>

      {bulkImportOpen && (
        <BulkImportModal entityType="transports" label="transport" onClose={() => setBulkImportOpen(false)} />
      )}

      <DataTable
        columns={columns}
        rows={initialTransports}
        rowKey={(t) => t.uid}
        searchPlaceholder="Search transport…"
        emptyMessage="No transport options yet — add your first one."
        actions={(t) => (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => openEdit(t)}>Edit</Button>
            <Button variant="danger" size="sm" onClick={() => handleDelete(t)}>Archive</Button>
          </div>
        )}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit transport" : "Add transport"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Select label="Mode" options={MODE_OPTIONS} value={form.modeCode} onChange={(e) => update("modeCode", e.target.value)} />

          <TextInput label="Vehicle type" value={form.vehicleTypeCode} onChange={(e) => update("vehicleTypeCode", e.target.value)} placeholder="e.g. Sedan, Minibus, Economy" />

          <TextInput label="Capacity" type="number" min={1} value={form.capacity} onChange={(e) => update("capacity", e.target.value)} />

          <Select
            label="Provider"
            options={transportProviders.map((p) => ({ value: p.uid, label: p.name }))}
            value={form.providerId}
            onChange={(e) => update("providerId", e.target.value)}
            placeholder={transportProviders.length ? "Select a provider" : "No transport providers yet"}
          />

          <TextInput label="Base price (USD)" type="number" min={0} step="0.01" value={form.basePrice} onChange={(e) => update("basePrice", e.target.value)} />

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
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save transport"}</Button>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
