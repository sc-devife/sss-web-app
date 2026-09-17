"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import type { ServiceProvider } from "@/lib/service-providers";
import type { EscapePoint } from "@/lib/escape-points";
import type { ReferenceOption } from "@/lib/reference-data";
import { fetchCountryOptions } from "@/lib/reference-data-client";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useIsDirty, chunkPairs } from "@/lib/forms";
import { required, runValidators, emailField, countryCodeField, mobileField } from "@/lib/validators";
import { useAppDispatch } from "@/store/hooks";
import { createServiceProvider, updateServiceProvider } from "@/features/serviceProviders/serviceProvidersThunks";

export const SERVICE_PROVIDER_TYPE_OPTIONS = [
  { value: "transport", label: "Transport" },
  { value: "activity", label: "Activity" },
  { value: "guide", label: "Guide" },
  { value: "other", label: "Other" },
];

// The one quantity field's label changes with the selected Type — see
// ServiceProvider.quantity on the backend for why this is a single column
// rather than four type-specific ones.
const QUANTITY_LABELS: Record<string, string> = {
  transport: "No. of Vehicles",
  activity: "No. of Activities",
  guide: "No. of Guides",
  other: "No. of Other",
};

const emptyForm = {
  name: "",
  typeCode: "transport",
  quantity: "",
  otherTypeLabel: "",
  contactName: "",
  contactNumber: "",
  contactEmail: "",
  countryCode: "",
  escapePointId: "",
  status: "active",
};

type FormState = typeof emptyForm;

function snapshotFrom(provider: ServiceProvider): FormState {
  return {
    name: provider.name,
    typeCode: provider.typeCode,
    quantity: provider.quantity != null ? String(provider.quantity) : "",
    otherTypeLabel: provider.otherTypeLabel ?? "",
    contactName: provider.contactName ?? "",
    contactNumber: provider.contactNumber ?? "",
    contactEmail: provider.contactEmail ?? "",
    countryCode: provider.countryCode ?? "",
    escapePointId: provider.escapePoint?.uid ?? "",
    status: provider.status ?? "active",
  };
}

function validate(v: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  const nameErr = runValidators(v.name, [required("Name is required")]);
  if (nameErr) errors.name = nameErr;
  const contactEmailErr = runValidators(v.contactEmail, [emailField()]);
  if (contactEmailErr) errors.contactEmail = contactEmailErr;
  const contactNumberErr = runValidators(v.contactNumber, [countryCodeField(), mobileField()]); // optional, format-checked only if filled
  if (contactNumberErr) errors.contactNumber = contactNumberErr;
  return errors;
}

// Shared create/edit form — used by both ServiceProvidersPanel's inline
// quick-edit (row menu -> Edit) and the Service Provider Detail page's own
// Edit button, so the two never drift into separate validation/field sets.
export function ServiceProviderFormModal({
  open,
  provider,
  escapePoints,
  onClose,
  onSaved,
}: {
  open: boolean;
  // null = create mode
  provider: ServiceProvider | null;
  escapePoints: EscapePoint[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [original, setOriginal] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [countryOptions, setCountryOptions] = useState<ReferenceOption[]>([]);

  useEffect(() => {
    fetchCountryOptions().then(setCountryOptions);
  }, []);

  useEffect(() => {
    if (!open) return;
    const snapshot = provider ? snapshotFrom(provider) : emptyForm;
    setForm(snapshot);
    setOriginal(provider ? snapshot : null);
    setErrors({});
    setFormError(undefined);
  }, [open, provider]);

  const isDirty = useIsDirty(original, form);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (provider && !isDirty) return;
    setFormError(undefined);

    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const payload = {
        ...form,
        quantity: form.quantity ? Number(form.quantity) : null,
        otherTypeLabel: form.typeCode === "other" ? form.otherTypeLabel || null : null,
        escapePointId: form.escapePointId || null,
      };
      if (provider) {
        await dispatch(updateServiceProvider({ uid: provider.uid, payload })).unwrap();
      } else {
        await dispatch(createServiceProvider(payload)).unwrap();
      }
      onSaved();
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save service provider"));
    } finally {
      setSaving(false);
    }
  }

  // One flat, ordered list — chunkPairs() below groups it into 2-per-row,
  // so the Type-dependent field(s) always reflow into whatever comes next
  // (Country/Status) instead of leaving a gap next to them.
  const formFields = [
    <TextInput key="contactName" label="Contact Name" value={form.contactName} onChange={(e) => update("contactName", e.target.value)} />,
    <PhoneInput
      key="contactNumber"
      label="Contact Number"
      value={form.contactNumber}
      onChange={(v) => {
        update("contactNumber", v);
        setErrors((p) => ({ ...p, contactNumber: "" }));
      }}
      error={errors.contactNumber}
    />,
    <TextInput
      key="contactEmail"
      label="Contact Email"
      type="email"
      value={form.contactEmail}
      onChange={(e) => {
        update("contactEmail", e.target.value);
        setErrors((p) => ({ ...p, contactEmail: "" }));
      }}
      error={errors.contactEmail}
    />,
    <Select
      key="escapePoint"
      label="Escape Point"
      options={escapePoints.map((ep) => ({ value: ep.uid, label: ep.name }))}
      value={form.escapePointId}
      onChange={(e) => update("escapePointId", e.target.value)}
      placeholder={escapePoints.length ? "Select an escape point" : "No escape points added yet"}
      searchable
    />,
    <TextInput
      key="name"
      label="Company Name"
      value={form.name}
      onChange={(e) => {
        update("name", e.target.value);
        setErrors((p) => ({ ...p, name: "" }));
      }}
      error={errors.name}
      required
    />,
    <Select
      key="typeCode"
      label="Type"
      options={SERVICE_PROVIDER_TYPE_OPTIONS}
      value={form.typeCode}
      onChange={(e) => update("typeCode", e.target.value)}
      searchable
    />,
    ...(form.typeCode === "other"
      ? [
        <TextInput
          key="otherTypeLabel"
          label="Specify Other"
          value={form.otherTypeLabel}
          onChange={(e) => update("otherTypeLabel", e.target.value)}
        />,
        <TextInput
          key="quantityOther"
          label="No. of Other"
          type="number"
          min={0}
          value={form.quantity}
          onChange={(e) => update("quantity", e.target.value)}
        />,
      ]
      : [
        <TextInput
          key="quantity"
          label={QUANTITY_LABELS[form.typeCode] ?? "Quantity"}
          type="number"
          min={0}
          value={form.quantity}
          onChange={(e) => update("quantity", e.target.value)}
        />,
      ]),
    <Select
      key="countryCode"
      label="Country"
      options={countryOptions.map((c) => ({ value: c.code, label: c.label }))}
      value={form.countryCode}
      onChange={(e) => update("countryCode", e.target.value)}
      placeholder="Select a country"
    />,
    <Select
      key="status"
      label="Status"
      options={[
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ]}
      value={form.status}
      onChange={(e) => update("status", e.target.value)}
    />,
  ];

  return (
    <Modal
      open={open}
      onClose={() => {
        if (saving) return;
        onClose();
      }}
      title={provider ? "Edit Service Provider" : "Add Service Provider"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <fieldset disabled={saving} className="contents">
          {chunkPairs(formFields).map((pair, i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              {pair}
            </div>
          ))}
        </fieldset>

        {formError && (
          <Alert tone="danger" autoClose={false}>
            {formError}
          </Alert>
        )}

        <div className="flex gap-3 w-full border-t pt-5">
          <Button type="button" variant="ghost" disabled={saving} onClick={onClose} className="w-full">
            Cancel
          </Button>
          <Button type="submit" disabled={saving || (!!provider && !isDirty)} loading={saving} loadingText="Saving…" className="w-full">
            Save service provider
          </Button>
        </div>
      </form>
    </Modal>
  );
}
