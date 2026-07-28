"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import type { Lead } from "@/lib/leads";
import type { AppUser } from "@/lib/users";
import type { Destination } from "@/lib/destinations";
import { LeadDetailModal } from "@/components/leads/LeadDetailModal";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  destination: "",
  destinationId: "",
  numberOfPeople: "",
  travelDate: "",
  durationDays: "",
  budget: "",
  notes: "",
};

type FormState = typeof emptyForm;

const TERMINAL_STATUSES = ["Unqualified", "Lost", "Duplicate", "Converted"];

export function LeadsPanel({
  initialLeads,
  users,
  destinations,
}: {
  initialLeads: Lead[];
  users: AppUser[];
  destinations: Destination[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setForm(emptyForm);
    setError(undefined);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(undefined);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        destination: form.destination || null,
        destinationId: form.destinationId || null,
        numberOfPeople: form.numberOfPeople ? Number(form.numberOfPeople) : null,
        travelDate: form.travelDate || null,
        durationDays: form.durationDays ? Number(form.durationDays) : null,
        budget: form.budget ? Number(form.budget) : null,
        notes: form.notes || null,
      };
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to create lead");
      }
      setModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lead");
    } finally {
      setSaving(false);
    }
  }

  function userName(userId: number | null): string {
    if (!userId) return "Unassigned";
    return users.find((u) => u.seqp === userId)?.name ?? `User #${userId}`;
  }

  const columns: DataTableColumn<Lead>[] = [
    {
      key: "name",
      header: "Name",
      render: (l) => l.name,
      sortValue: (l) => l.name.toLowerCase(),
      filterValue: (l) => `${l.name} ${l.email} ${l.phone}`,
    },
    {
      key: "destination",
      header: "Destination",
      render: (l) => l.destination || "—",
      filterValue: (l) => l.destination ?? "",
    },
    {
      key: "status",
      header: "Status",
      render: (l) => (
        <div className="flex items-center gap-1">
          <Badge tone={TERMINAL_STATUSES.includes(l.status) ? (l.status === "Converted" ? "success" : "danger") : "neutral"}>
            {l.status}
          </Badge>
          {l.isPriority && <Badge tone="warning">Priority</Badge>}
        </div>
      ),
      sortValue: (l) => l.status,
    },
    {
      key: "source",
      header: "Source",
      render: (l) => l.sourceCode ?? "—",
      sortValue: (l) => l.sourceCode ?? "",
    },
    {
      key: "assignedTo",
      header: "Assigned to",
      render: (l) => userName(l.assignedToUserId),
      filterValue: (l) => userName(l.assignedToUserId),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Button className="self-start" onClick={openCreate}>Add lead</Button>

      <DataTable
        columns={columns}
        rows={initialLeads}
        rowKey={(l) => String(l.seqp)}
        searchPlaceholder="Search leads…"
        emptyMessage="No leads yet."
        actions={(l) => (
          <Button variant="secondary" size="sm" onClick={() => setSelectedLead(l)}>View</Button>
        )}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add lead">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextInput label="Name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          <TextInput label="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          <TextInput label="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />

          <TextInput label="Destination (free text)" value={form.destination} onChange={(e) => update("destination", e.target.value)} placeholder="e.g. Bali" />
          <Select
            label="Destination (library)"
            options={destinations.map((d) => ({ value: d.uid, label: d.name }))}
            value={form.destinationId}
            onChange={(e) => update("destinationId", e.target.value)}
            placeholder="Optional — link to a library destination"
          />

          <div className="grid grid-cols-2 gap-4">
            <TextInput label="Travellers" type="number" min={1} value={form.numberOfPeople} onChange={(e) => update("numberOfPeople", e.target.value)} />
            <TextInput label="Duration (days)" type="number" min={1} value={form.durationDays} onChange={(e) => update("durationDays", e.target.value)} />
            <TextInput label="Travel date" type="date" value={form.travelDate} onChange={(e) => update("travelDate", e.target.value)} />
            <TextInput label="Budget" type="number" min={0} value={form.budget} onChange={(e) => update("budget", e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="lead-notes" className="text-sm font-medium text-foreground">Notes</label>
            <textarea
              id="lead-notes"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={2}
              className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save lead"}</Button>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {selectedLead && (
        <LeadDetailModal lead={selectedLead} users={users} destinations={destinations} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  );
}
