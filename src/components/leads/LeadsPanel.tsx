"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Body } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import type { Lead } from "@/lib/leads";
import type { AppUser } from "@/lib/users";
import type { EscapePoint } from "@/lib/escape-points";
import { LeadDetailModal } from "@/components/leads/LeadDetailModal";
import { FaPlus } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchLeads, createLead } from "@/features/leads/leadsThunks";
import { resetCreateStatus } from "@/features/leads/leadsSlice";
import {
  selectLeads,
  selectLeadsStatus,
  selectLeadsError,
  selectCreateLeadStatus,
  selectCreateLeadError,
} from "@/features/leads/leadsSelectors";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  destination: "",
  escapePointId: "",
  numberOfPeople: "",
  travelDate: "",
  durationDays: "",
  budget: "",
  originCity: "",
  travelType: "",
  isPriority: false,
  notes: "",
};

type FormState = typeof emptyForm;

const TERMINAL_STATUSES = ["Unqualified", "Lost", "Duplicate", "Converted"];

export function LeadsPanel({
  users,
  escapePoints,
}: {
  users: AppUser[];
  escapePoints: EscapePoint[];
}) {
  const dispatch = useAppDispatch();
  const leads = useAppSelector(selectLeads);
  const status = useAppSelector(selectLeadsStatus);
  const listError = useAppSelector(selectLeadsError);
  const createStatus = useAppSelector(selectCreateLeadStatus);
  const createError = useAppSelector(selectCreateLeadError);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [validationError, setValidationError] = useState<string | undefined>();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    dispatch(fetchLeads());
  }, [dispatch]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setForm(emptyForm);
    setValidationError(undefined);
    dispatch(resetCreateStatus());
    setModalOpen(true);
  }

  function validate(): string | undefined {
    if (!form.name.trim()) return "Name is required";
    if (!form.email.trim() && !form.phone.trim()) return "Provide at least an email or phone number";
    return undefined;
  }

  const durationDaysNumber = Number(form.durationDays);
  const durationInfoMessage =
    Number.isInteger(durationDaysNumber) && durationDaysNumber >= 1
      ? `${durationDaysNumber} Night${durationDaysNumber === 1 ? "" : "s"}, ${durationDaysNumber + 1} Days`
      : "";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(undefined);
    try {
      await dispatch(
        createLead({
          name: form.name,
          email: form.email,
          phone: form.phone,
          destination: form.destination || null,
          escapePointId: form.escapePointId || null,
          numberOfPeople: form.numberOfPeople ? Number(form.numberOfPeople) : null,
          travelDate: form.travelDate || null,
          durationDays: form.durationDays ? Number(form.durationDays) : null,
          budget: form.budget ? Number(form.budget) : null,
          originCity: form.originCity || null,
          travelType: form.travelType || null,
          isPriority: form.isPriority,
          notes: form.notes || null,
        }),
      ).unwrap();
      setModalOpen(false);
      dispatch(fetchLeads());
    } catch {
      // createError is already set in the slice; the modal reads it directly.
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
      header: "Escape Point",
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
      <div className="flex justify-end gap-2">
        <Button className="self-start" onClick={openCreate}><FaPlus />Add lead</Button>
      </div>

      {status === "loading" && leads.length === 0 ? (
        <LoadingState label="Loading leads…" />
      ) : status === "failed" ? (
        <Body className="text-danger">{listError}</Body>
      ) : (
        <DataTable
          columns={columns}
          rows={leads}
          rowKey={(l) => l.uid}
          searchPlaceholder="Search leads…"
          emptyMessage="No leads yet."
          actions={(l) => (
            <Button variant="secondary" size="sm" onClick={() => setSelectedLead(l)}>View</Button>
          )}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add lead">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextInput label="Name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          <div className="grid grid-cols-2 gap-4">
            <TextInput label="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            <PhoneInput label="Phone" value={form.phone} onChange={(v) => update("phone", v)} />
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">Email or phone is required (at least one).</p>

          <TextInput label="Escape Point (free text)" value={form.destination} onChange={(e) => update("destination", e.target.value)} placeholder="e.g. Bali" />
          <Select
            label="Escape Point (library)"
            options={escapePoints.map((d) => ({ value: d.uid, label: d.name }))}
            value={form.escapePointId}
            onChange={(e) => update("escapePointId", e.target.value)}
            placeholder="Optional — link to a library escape point"
          />

          <div className="grid grid-cols-2 gap-4">
            <TextInput label="Travellers" type="number" min={1} value={form.numberOfPeople} onChange={(e) => update("numberOfPeople", e.target.value)} />
            <div>
              <TextInput label="No. of Nights" type="number" min={1} value={form.durationDays} onChange={(e) => update("durationDays", e.target.value)} />
              {durationInfoMessage ? (
                <p className="mt-1 text-xs text-muted-foreground">{durationInfoMessage}</p>
              ) : null}
            </div>
            <TextInput label="Travel date" type="date" value={form.travelDate} onChange={(e) => update("travelDate", e.target.value)} />
            <TextInput label="Budget" type="number" min={0} value={form.budget} onChange={(e) => update("budget", e.target.value)} />
            <TextInput label="Origin city" value={form.originCity} onChange={(e) => update("originCity", e.target.value)} placeholder="e.g. Mumbai" />
            <Select
              label="Travel type"
              options={[
                { value: "honeymoon", label: "Honeymoon" },
                { value: "family", label: "Family" },
                { value: "friends", label: "Friends" },
                { value: "solo", label: "Solo" },
                { value: "business", label: "Business" },
                { value: "other", label: "Other" },
              ]}
              value={form.travelType}
              onChange={(e) => update("travelType", e.target.value)}
              placeholder="Not specified"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-primary"
              checked={form.isPriority}
              onChange={(e) => update("isPriority", e.target.checked)}
            />
            Mark as priority lead
          </label>

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

          {(validationError || createError) && <p className="text-sm text-danger">{validationError || createError}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={createStatus === "loading"}>{createStatus === "loading" ? "Saving…" : "Save lead"}</Button>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {selectedLead && (
        <LeadDetailModal lead={selectedLead} users={users} escapePoints={escapePoints} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  );
}
