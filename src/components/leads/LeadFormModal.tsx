"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Select } from "@/components/ui/Select";
import { MultiSelectSearch } from "@/components/ui/MultiSelectSearch";
import { Modal } from "@/components/ui/Modal";
import { countryCodeField, runValidators } from "@/lib/validators";
import { todayIsoDate } from "@/lib/date";
import type { Lead } from "@/lib/leads";
import type { EscapePoint } from "@/lib/escape-points";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createLead, updateLead } from "@/features/leads/leadsThunks";
import { resetCreateStatus } from "@/features/leads/leadsSlice";
import { selectCreateLeadStatus, selectCreateLeadError } from "@/features/leads/leadsSelectors";

const SOURCE_CHANNEL_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "google_ads", label: "Google Ads" },
];

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  // Kept in state (never rendered — the free-text field was removed) purely
  // so editing a legacy lead round-trips its existing historical value
  // instead of silently wiping it on save. New leads never populate this.
  destination: null as string | null,
  escapePointIds: [] as string[],
  numberOfPeople: "",
  travelDate: "",
  durationNights: "",
  budget: "",
  originCity: "",
  travelType: "",
  isPriority: false,
  notes: "",
  sourceType: "DIRECT" as "DIRECT" | "AGENCY",
  sourceChannel: "manual",
  agencyContactName: "",
  agencyContactEmail: "",
  agencyContactPhone: "",
  agencyBillingName: "",
};

type FormState = typeof emptyForm;

function validate(v: FormState): string | undefined {
  if (!v.name.trim()) return "Name is required";
  if (!v.email.trim() && !v.phone.trim()) return "Provide at least an email or phone number";
  if (v.sourceType === "AGENCY" && !v.agencyContactName.trim()) return "Agency contact name is required";
  if (v.travelDate && v.travelDate < todayIsoDate()) return "Travel date cannot be in the past";
  if (v.durationNights && Number(v.durationNights) < 0) return "No. of Night cannot be negative";
  return undefined;
}

// Shared Add/Edit form for Leads — used by both the list page (LeadsPanel,
// create + edit) and the detail page (LeadDetailPanel, edit only), same
// "one form modal, two call sites" pattern EscapePointFormModal/
// HotelFormModal already establish.
export function LeadFormModal({
  open,
  lead,
  escapePoints,
  onClose,
  onSaved,
}: {
  open: boolean;
  lead: Lead | null;
  escapePoints: EscapePoint[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const dispatch = useAppDispatch();
  const editing = lead;
  const createStatus = useAppSelector(selectCreateLeadStatus);
  const createError = useAppSelector(selectCreateLeadError);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [validationError, setValidationError] = useState<string | undefined>();
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [agencyPhoneError, setAgencyPhoneError] = useState<string | undefined>();

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name,
        email: editing.email,
        phone: editing.phone,
        destination: editing.destination ?? null,
        escapePointIds: editing.escapePointIds,
        numberOfPeople: editing.numberOfPeople != null ? String(editing.numberOfPeople) : "",
        travelDate: editing.travelDate ?? "",
        durationNights: editing.durationNights != null ? String(editing.durationNights) : "",
        budget: editing.budget != null ? String(editing.budget) : "",
        originCity: editing.originCity ?? "",
        travelType: editing.travelType ?? "",
        isPriority: editing.isPriority ?? false,
        notes: editing.notes ?? "",
        sourceType: editing.sourceType ?? "DIRECT",
        sourceChannel: editing.sourceChannel ?? "manual",
        agencyContactName: editing.agencyDetails?.contactName ?? "",
        agencyContactEmail: editing.agencyDetails?.contactEmail ?? "",
        agencyContactPhone: editing.agencyDetails?.contactPhone ?? "",
        agencyBillingName: editing.agencyDetails?.billingName ?? "",
      });
    } else {
      setForm(emptyForm);
    }
    setValidationError(undefined);
    setPhoneError(undefined);
    setAgencyPhoneError(undefined);
    dispatch(resetCreateStatus());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing?.uid]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Day = No. of Night + 1 — surfaced live under the field so it's obvious
  // what stay length a given night count implies, without doing the math.
  const durationNightsNumber = Number(form.durationNights);
  const durationInfoMessage =
    form.durationNights !== "" && Number.isInteger(durationNightsNumber) && durationNightsNumber >= 0
      ? `Day ${durationNightsNumber + 1} Night ${durationNightsNumber}`
      : "";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validate(form);
    const nextPhoneError = runValidators(form.phone, [countryCodeField()]);
    const nextAgencyPhoneError =
      form.sourceType === "AGENCY" ? runValidators(form.agencyContactPhone, [countryCodeField()]) : undefined;
    if (err || nextPhoneError || nextAgencyPhoneError) {
      setValidationError(err);
      setPhoneError(nextPhoneError);
      setAgencyPhoneError(nextAgencyPhoneError);
      return;
    }
    setValidationError(undefined);
    setPhoneError(undefined);
    setAgencyPhoneError(undefined);
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      destination: form.destination,
      escapePointIds: form.escapePointIds,
      numberOfPeople: form.numberOfPeople ? Number(form.numberOfPeople) : null,
      travelDate: form.travelDate || null,
      durationNights: form.durationNights ? Number(form.durationNights) : null,
      budget: form.budget ? Number(form.budget) : null,
      originCity: form.originCity || null,
      travelType: form.travelType || null,
      isPriority: form.isPriority,
      notes: form.notes || null,
      sourceType: form.sourceType,
      sourceChannel: form.sourceType === "DIRECT" ? form.sourceChannel : null,
      agencyDetails:
        form.sourceType === "AGENCY"
          ? {
            contactName: form.agencyContactName,
            contactEmail: form.agencyContactEmail || null,
            contactPhone: form.agencyContactPhone || null,
            billingName: form.agencyBillingName || null,
            city: null,
            state: null,
            country: null,
            pincode: null,
            streetAddress: null,
            locality: null,
            landmark: null,
            additionalBillingDetails: null,
          }
          : null,
    };
    try {
      if (editing) {
        await dispatch(updateLead({ leadUid: editing.uid, ...payload })).unwrap();
      } else {
        await dispatch(createLead(payload)).unwrap();
      }
      onSaved();
    } catch {
      // createError is already set in the slice; the form reads it directly.
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit lead" : "Add lead"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextInput label="Name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
        <div className="grid grid-cols-2 gap-4">
          <TextInput label="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          <PhoneInput
            label="Phone"
            value={form.phone}
            onChange={(v) => {
              update("phone", v);
              setPhoneError(undefined);
            }}
            required
            error={phoneError}
          />
        </div>

        <MultiSelectSearch
          label="Escape Point"
          helperText="Select one or more"
          placeholder="Search Escape Point…"
          options={escapePoints.map((d) => ({ value: d.uid, label: d.name }))}
          value={form.escapePointIds}
          onChange={(next) => update("escapePointIds", next)}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <TextInput label="Travellers" type="number" min={1} value={form.numberOfPeople} onChange={(e) => update("numberOfPeople", e.target.value)} />
          <div>
            <TextInput
              label="No. of Night"
              type="number"
              min={0}
              value={form.durationNights}
              onChange={(e) => update("durationNights", e.target.value.replace(/[^0-9]/g, ""))}
            />
            {durationInfoMessage ? (
              <p className="mt-1 text-xs text-muted-foreground">{durationInfoMessage}</p>
            ) : null}
          </div>
          <DatePicker label="Travel date" value={form.travelDate} onChange={(v) => update("travelDate", v)} min={todayIsoDate()} />
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

        <div className="flex flex-col gap-3 rounded border border-border p-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Source</span>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="sourceType"
                  checked={form.sourceType === "DIRECT"}
                  onChange={() => update("sourceType", "DIRECT")}
                  className="h-4 w-4 text-primary focus:ring-primary"
                />
                Direct
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="sourceType"
                  checked={form.sourceType === "AGENCY"}
                  onChange={() => update("sourceType", "AGENCY")}
                  className="h-4 w-4 text-primary focus:ring-primary"
                />
                Agency
              </label>
            </div>
          </div>

          {form.sourceType === "DIRECT" ? (
            <Select
              label="Channel"
              options={SOURCE_CHANNEL_OPTIONS}
              value={form.sourceChannel}
              onChange={(e) => update("sourceChannel", e.target.value)}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <TextInput label="Agency contact name" value={form.agencyContactName} onChange={(e) => update("agencyContactName", e.target.value)} required />
              <TextInput label="Contact email" type="email" value={form.agencyContactEmail} onChange={(e) => update("agencyContactEmail", e.target.value)} />
              <PhoneInput
                label="Contact phone"
                value={form.agencyContactPhone}
                onChange={(v) => {
                  update("agencyContactPhone", v);
                  setAgencyPhoneError(undefined);
                }}
                error={agencyPhoneError}
              />
              <TextInput label="Billing name" value={form.agencyBillingName} onChange={(e) => update("agencyBillingName", e.target.value)} placeholder="Defaults to contact name" />
            </div>
          )}
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
            className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          />
        </div>

        {(validationError || createError) && <p className="text-sm text-danger">{validationError || createError}</p>}

        <div className="flex gap-3 w-full border-t pt-5">
          <Button type="button" variant="ghost" onClick={onClose} className="w-full">Cancel</Button>
          <Button
            type="submit"
            loading={createStatus === "loading"}
            loadingText="Saving…"
            className="w-full"
          >
            {editing ? "Save changes" : "Save lead"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
