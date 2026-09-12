"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Select } from "@/components/ui/Select";
import { ToolbarSelect } from "@/components/ui/ToolbarSelect";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { BulkImportModal } from "@/components/library/BulkImportModal";
import { Alert } from "@/components/ui/Alert";
import { Body } from "@/components/ui/Typography";
import type { Transport } from "@/lib/transports";
import type { ServiceProvider } from "@/lib/service-providers";
import type { EscapePoint } from "@/lib/escape-points";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useIsDirty, chunkPairs } from "@/lib/forms";
import { positiveNumber, required, requiredSelection, runValidators, emailField, countryCodeField, mobileField } from "@/lib/validators";
import { cn } from "@/lib/cn";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTransports, createTransport, updateTransport, deleteTransport } from "@/features/transports/transportsThunks";
import { selectTransports, selectTransportsStatus, selectTransportsError } from "@/features/transports/transportsSelectors";
import { FaPlus } from "react-icons/fa";
import { LuImport } from "react-icons/lu";
import { MODE_OPTIONS, VEHICLE_TYPE_OPTIONS } from "@/lib/transport-modes";

// Every mode the system supports (mirrors ESCAPE_STATUS_ORDER's precedent on
// the Escapes toolbar) — not just whichever modes happen to appear in
// today's data, so the filter doesn't silently miss one once a transport
// using it is added.
const MODE_FILTER_OPTIONS = [{ value: "", label: "Default" }, ...MODE_OPTIONS];

const OWNER_TYPE_OPTIONS = [
  { value: "single", label: "Single Vehicle Owner" },
  { value: "multi", label: "Multi Vehicle Owner" },
];

const emptyForm = {
  ownerType: "multi",
  modeCode: "",
  vehicleTypeCode: "",
  vehicleNumber: "",
  capacity: "",
  providerId: "",
  basePrice: "",
  pickupLocation: "",
  dropLocation: "",
  contactName: "",
  contactNumber: "",
  contactEmail: "",
  escapePointId: "",
  status: "active",
};

type FormState = typeof emptyForm;

function validate(v: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  const modeErr = requiredSelection(v.modeCode, "Please select a mode");
  if (modeErr) errors.modeCode = modeErr;
  const capacityErr = runValidators(v.capacity, [positiveNumber("Capacity must be a positive number")]);
  if (capacityErr) errors.capacity = capacityErr;
  const priceErr = runValidators(v.basePrice, [positiveNumber("Base price must be a positive number")]);
  if (priceErr) errors.basePrice = priceErr;
  const contactEmailErr = runValidators(v.contactEmail, [emailField()]);
  if (contactEmailErr) errors.contactEmail = contactEmailErr;

  // Vehicle Owner Type decides which of Provider vs Contact Name/Number is
  // the required identifier for this transport — see TransportPanel's form.
  if (v.ownerType === "single") {
    const contactNameErr = runValidators(v.contactName, [required("Contact name is required")]);
    if (contactNameErr) errors.contactName = contactNameErr;
    const contactNumberErr = runValidators(v.contactNumber, [required("Contact number is required"), countryCodeField(), mobileField()]);
    if (contactNumberErr) errors.contactNumber = contactNumberErr;
  } else {
    const providerErr = requiredSelection(v.providerId, "Please select a provider");
    if (providerErr) errors.providerId = providerErr;
    const contactNumberErr = runValidators(v.contactNumber, [countryCodeField(), mobileField()]); // optional, format-checked only if filled
    if (contactNumberErr) errors.contactNumber = contactNumberErr;
  }
  return errors;
}

export function TransportPanel({
  providers,
  escapePoints,
}: {
  providers: ServiceProvider[];
  escapePoints: EscapePoint[];
}) {
  const dispatch = useAppDispatch();
  const transports = useAppSelector(selectTransports);
  const status = useAppSelector(selectTransportsStatus);
  const error = useAppSelector(selectTransportsError);

  const [modalOpen, setModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [editing, setEditing] = useState<Transport | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [original, setOriginal] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [escapePointFilter, setEscapePointFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");

  useEffect(() => {
    dispatch(fetchTransports());
  }, [dispatch]);

  const escapePointOptions = useMemo(
    () => [{ value: "", label: "Default" }, ...escapePoints.map((ep) => ({ value: ep.uid, label: ep.name }))],
    [escapePoints],
  );

  // Stays client-side, same as DataTable's own search/pagination — the full
  // list is already fetched up front, no backend change needed.
  const visibleTransports = useMemo(() => {
    return transports.filter((t) => {
      if (escapePointFilter && t.escapePoint?.uid !== escapePointFilter) return false;
      if (modeFilter && t.modeCode !== modeFilter) return false;
      return true;
    });
  }, [transports, escapePointFilter, modeFilter]);

  const vehicleTypeOptions = VEHICLE_TYPE_OPTIONS[form.modeCode] ?? [];

  const transportProviders = providers.filter((p) => p.typeCode === "transport");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOriginal(null);
    setErrors({});
    setFormError(undefined);
    setModalOpen(true);
  }

  function openEdit(transport: Transport) {
    const snapshot: FormState = {
      // Existing records predate this field — infer from whether a provider
      // is already linked rather than leaving it unset.
      ownerType: transport.ownerType ?? (transport.provider ? "multi" : "single"),
      modeCode: transport.modeCode,
      vehicleTypeCode: transport.vehicleTypeCode ?? "",
      vehicleNumber: transport.vehicleNumber ?? "",
      capacity: transport.capacity ? String(transport.capacity) : "",
      providerId: transport.provider?.uid ?? "",
      basePrice: transport.basePrice != null ? String(transport.basePrice) : "",
      pickupLocation: transport.pickupLocation ?? "",
      dropLocation: transport.dropLocation ?? "",
      contactName: transport.contactName ?? "",
      contactNumber: transport.contactNumber ?? "",
      contactEmail: transport.contactEmail ?? "",
      escapePointId: transport.escapePoint?.uid ?? "",
      status: transport.status ?? "active",
    };
    setEditing(transport);
    setForm(snapshot);
    setOriginal(snapshot);
    setErrors({});
    setFormError(undefined);
    setModalOpen(true);
  }

  const isDirty = useIsDirty(original, form);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editing && !isDirty) return;
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
        ownerType: form.ownerType,
        modeCode: form.modeCode,
        vehicleTypeCode: form.vehicleTypeCode || null,
        vehicleNumber: form.vehicleNumber || null,
        capacity: form.capacity ? Number(form.capacity) : null,
        // Provider only applies to a Multi Vehicle Owner — cleared here so
        // switching a record to Single doesn't leave a stale provider link.
        providerId: form.ownerType === "multi" ? form.providerId || null : null,
        basePrice: form.basePrice ? Number(form.basePrice) : null,
        pickupLocation: form.pickupLocation || null,
        dropLocation: form.dropLocation || null,
        contactName: form.contactName || null,
        contactNumber: form.contactNumber || null,
        contactEmail: form.contactEmail || null,
        escapePointId: form.escapePointId || null,
        status: form.status,
      };
      if (editing) {
        await dispatch(updateTransport({ uid: editing.uid, payload })).unwrap();
      } else {
        await dispatch(createTransport(payload)).unwrap();
      }
      dispatch(fetchTransports());
      setModalOpen(false);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save transport"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(transport: Transport) {
    setDeletingUid(transport.uid);
    try {
      await dispatch(deleteTransport(transport.uid));
      dispatch(fetchTransports());
    } finally {
      setDeletingUid(null);
    }
  }

  const columns: DataTableColumn<Transport>[] = [
    {
      key: "escapePoint",
      header: "Escape Point",
      render: (t) => t.escapePoint?.name ?? "—",
      filterValue: (t) => t.escapePoint?.name ?? "",
    },
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
      header: "Base price (INR)",
      render: (t) => (t.basePrice != null ? `₹${t.basePrice.toFixed(2)}` : "—"),
      sortValue: (t) => t.basePrice ?? 0,
    },
    {
      key: "status",
      header: "Status",
      render: (t) => <Badge tone={t.status === "archived" ? "danger" : "success"}>{t.status ?? "active"}</Badge>,
      sortValue: (t) => t.status ?? "",
    },
  ];

  // One flat, ordered list — chunkPairs() below groups it into 2-per-row, so
  // Provider (hidden for a Single Vehicle Owner) never leaves a gap next to
  // Mode: whichever field comes next always reflows up into its place.
  const formFields = [
    <TextInput
      key="contactName"
      label="Contact Name"
      value={form.contactName}
      onChange={(e) => {
        update("contactName", e.target.value);
        setErrors((p) => ({ ...p, contactName: "" }));
      }}
      error={errors.contactName}
      required={form.ownerType === "single"}
    />,
    <PhoneInput
      key="contactNumber"
      label="Contact Number"
      value={form.contactNumber}
      onChange={(v) => {
        update("contactNumber", v);
        setErrors((p) => ({ ...p, contactNumber: "" }));
      }}
      error={errors.contactNumber}
      required={form.ownerType === "single"}
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
      options={escapePoints.map((d) => ({ value: d.uid, label: d.name }))}
      value={form.escapePointId}
      onChange={(e) => update("escapePointId", e.target.value)}
      placeholder={escapePoints.length ? "Select an escape point" : "No escape points added yet"}
      searchable
    />,
    ...(form.ownerType === "multi"
      ? [
        <Select
          key="providerId"
          label="Provider"
          options={transportProviders.map((p) => ({ value: p.uid, label: p.name }))}
          value={form.providerId}
          onChange={(e) => {
            update("providerId", e.target.value);
            setErrors((p) => ({ ...p, providerId: "" }));
          }}
          error={errors.providerId}
          placeholder={transportProviders.length ? "Select a provider" : "No transport providers yet"}
          searchable
          required
        />,
      ]
      : []),
    <Select
      key="modeCode"
      label="Mode"
      options={MODE_OPTIONS}
      value={form.modeCode}
      onChange={(e) => {
        update("modeCode", e.target.value);
        update("vehicleTypeCode", "");
        setErrors((p) => ({ ...p, modeCode: "" }));
      }}
      error={errors.modeCode}
      placeholder="Select mode"
    />,
    <Select
      key="vehicleTypeCode"
      label="Vehicle type"
      options={vehicleTypeOptions}
      value={form.vehicleTypeCode}
      onChange={(e) => update("vehicleTypeCode", e.target.value)}
      placeholder={vehicleTypeOptions.length ? "Select vehicle type" : "Not applicable"}
      disabled={!vehicleTypeOptions.length}
    />,
    <TextInput key="vehicleNumber" label="Vehicle Number" value={form.vehicleNumber} onChange={(e) => update("vehicleNumber", e.target.value)} />,
    <TextInput
      key="capacity"
      label="Capacity"
      type="number"
      min={1}
      value={form.capacity}
      onChange={(e) => {
        update("capacity", e.target.value);
        setErrors((p) => ({ ...p, capacity: "" }));
      }}
      error={errors.capacity}
    />,
    <TextInput
      key="pickupLocation"
      label="Pickup Location"
      value={form.pickupLocation}
      onChange={(e) => update("pickupLocation", e.target.value)}
    />,
    <TextInput key="dropLocation" label="Drop Location" value={form.dropLocation} onChange={(e) => update("dropLocation", e.target.value)} />,
    <TextInput
      key="basePrice"
      label="Base price (INR)"
      type="number"
      min={0}
      step="0.01"
      value={form.basePrice}
      onChange={(e) => {
        update("basePrice", e.target.value);
        setErrors((p) => ({ ...p, basePrice: "" }));
      }}
      error={errors.basePrice}
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
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 justify-end">
        <Button className="self-start" onClick={openCreate}><FaPlus />Add Transport</Button>
        <Button variant="secondary" className="self-start" onClick={() => setBulkImportOpen(true)}><LuImport />Bulk Import</Button>
      </div>

      {bulkImportOpen && (
        <BulkImportModal
          entityType="transports"
          label="transport"
          onClose={() => setBulkImportOpen(false)}
          onImported={() => dispatch(fetchTransports())}
        />
      )}

      {status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <DataTable
          columns={columns}
          rows={visibleTransports}
          rowKey={(t) => t.uid}
          searchPlaceholder="Search transport…"
          emptyMessage="No transport options yet — add your first one."
          onRowClick={(t) => openEdit(t)}
          getRowLabel={(t) => MODE_OPTIONS.find((m) => m.value === t.modeCode)?.label ?? t.modeCode}
          loading={status !== "succeeded" && transports.length === 0}
          rowMenuActions={(t) => [
            { key: "edit", label: "Edit", onSelect: () => openEdit(t) },
            { key: "archive", label: "Archive", tone: "danger", disabled: deletingUid === t.uid, onSelect: () => handleDelete(t) },
          ]}
          toolbarExtra={
            <div className="flex items-center gap-2">
              <ToolbarSelect
                label="Escape Point"
                options={escapePointOptions}
                value={escapePointFilter}
                onChange={setEscapePointFilter}
                placeholder="Default"
                searchable
                searchPlaceholder="Search Escape Point…"
              />
              <ToolbarSelect label="Mode" options={MODE_FILTER_OPTIONS} value={modeFilter} onChange={setModeFilter} placeholder="Default" />
            </div>
          }
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          if (saving) return;
          setModalOpen(false);
        }}
        title={editing ? "Edit Transport" : "Add Transport"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <fieldset disabled={saving} className="contents">

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Vehicle Owner Type</span>
              <div className="inline-flex w-fit items-center gap-1 rounded-full bg-muted p-1">
                {OWNER_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      update("ownerType", opt.value);
                      setErrors((p) => ({ ...p, contactName: "", contactNumber: "", providerId: "" }));
                    }}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                      form.ownerType === opt.value
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

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
            <Button type="button" variant="ghost" disabled={saving} onClick={() => setModalOpen(false)} className="w-full">
              Cancel
            </Button>
            <Button type="submit" disabled={saving || (!!editing && !isDirty)} loading={saving} loadingText="Saving…" className="w-full">
              Save transport
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
