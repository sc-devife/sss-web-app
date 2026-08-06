"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { BulkImportModal } from "@/components/library/BulkImportModal";
import { Alert } from "@/components/ui/Alert";
import { Body } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import type { Transport } from "@/lib/transports";
import type { ServiceProvider } from "@/lib/service-providers";
import type { EscapePoint } from "@/lib/escape-points";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useIsDirty } from "@/lib/forms";
import { positiveNumber, requiredSelection, runValidators } from "@/lib/validators";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTransports, createTransport, updateTransport, deleteTransport } from "@/features/transports/transportsThunks";
import { selectTransports, selectTransportsStatus, selectTransportsError } from "@/features/transports/transportsSelectors";
import { FaPlus } from "react-icons/fa";
import { LuImport } from "react-icons/lu";

const MODE_OPTIONS = [
  { value: "flight", label: "Flight" },
  { value: "train", label: "Train" },
  { value: "bus", label: "Bus" },
  { value: "coach", label: "Coach" },
  { value: "car", label: "Car" },
  { value: "taxi", label: "Taxi / Cab" },
  { value: "van", label: "Van" },
  { value: "boat", label: "Boat" },
  { value: "ferry", label: "Ferry" },
  { value: "cruise", label: "Cruise" },
  { value: "helicopter", label: "Helicopter" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "bicycle", label: "Bicycle" },
  { value: "walking", label: "Walking" },
  { value: "cable_car", label: "Cable Car / Gondola" },
  { value: "funicular", label: "Funicular" },
  { value: "camel", label: "Camel" },
  { value: "horse", label: "Horse" },
  { value: "atv", label: "ATV / Jeep Safari" },
  { value: "other", label: "Other" },
];

const VEHICLE_TYPE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  flight: [
    { value: "economy", label: "Economy" },
    { value: "premium_economy", label: "Premium Economy" },
    { value: "business", label: "Business" },
    { value: "first", label: "First Class" },
  ],

  train: [
    { value: "chair_car", label: "Chair Car" },
    { value: "sleeper", label: "Sleeper" },
    { value: "ac_3_tier", label: "AC 3 Tier" },
    { value: "ac_2_tier", label: "AC 2 Tier" },
    { value: "first_class", label: "First Class" },
  ],

  bus: [
    { value: "mini_bus", label: "Mini Bus" },
    { value: "coach", label: "Coach" },
    { value: "sleeper_bus", label: "Sleeper Bus" },
    { value: "volvo", label: "Volvo Bus" },
  ],

  coach: [
    { value: "standard_coach", label: "Standard Coach" },
    { value: "luxury_coach", label: "Luxury Coach" },
  ],

  car: [
    { value: "hatchback", label: "Hatchback" },
    { value: "sedan", label: "Sedan" },
    { value: "suv", label: "SUV" },
    { value: "luxury", label: "Luxury Car" },
  ],

  taxi: [
    { value: "sedan", label: "Sedan" },
    { value: "suv", label: "SUV" },
    { value: "premium", label: "Premium Cab" },
  ],

  van: [
    { value: "minivan", label: "Minivan" },
    { value: "tempo_traveller", label: "Tempo Traveller" },
    { value: "passenger_van", label: "Passenger Van" },
  ],

  boat: [
    { value: "speed_boat", label: "Speed Boat" },
    { value: "houseboat", label: "Houseboat" },
    { value: "yacht", label: "Yacht" },
  ],

  ferry: [
    { value: "passenger_ferry", label: "Passenger Ferry" },
    { value: "vehicle_ferry", label: "Vehicle Ferry" },
  ],

  cruise: [
    { value: "river_cruise", label: "River Cruise" },
    { value: "ocean_cruise", label: "Ocean Cruise" },
  ],

  helicopter: [
    { value: "shared", label: "Shared Helicopter" },
    { value: "private", label: "Private Charter" },
  ],

  motorcycle: [
    { value: "motorcycle", label: "Motorcycle" },
    { value: "scooter", label: "Scooter" },
  ],

  bicycle: [
    { value: "standard", label: "Standard Bicycle" },
    { value: "mountain", label: "Mountain Bike" },
    { value: "electric", label: "Electric Bike" },
  ],

  walking: [],

  cable_car: [
    { value: "gondola", label: "Gondola" },
    { value: "cable_car", label: "Cable Car" },
  ],

  funicular: [
    { value: "funicular", label: "Funicular" },
  ],

  camel: [
    { value: "camel", label: "Camel" },
  ],

  horse: [
    { value: "horse", label: "Horse" },
  ],

  atv: [
    { value: "atv", label: "ATV" },
    { value: "jeep", label: "4x4 Jeep" },
  ],

  other: [],
};


const emptyForm = {
  modeCode: "",
  vehicleTypeCode: "",
  capacity: "",
  providerId: "",
  basePrice: "",
  pickupLocation: "",
  dropLocation: "",
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

  useEffect(() => {
    dispatch(fetchTransports());
  }, [dispatch]);

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
      modeCode: transport.modeCode,
      vehicleTypeCode: transport.vehicleTypeCode ?? "",
      capacity: transport.capacity ? String(transport.capacity) : "",
      providerId: transport.provider?.uid ?? "",
      basePrice: transport.basePrice != null ? String(transport.basePrice) : "",
      pickupLocation: transport.pickupLocation ?? "",
      dropLocation: transport.dropLocation ?? "",
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
        modeCode: form.modeCode,
        vehicleTypeCode: form.vehicleTypeCode || null,
        capacity: form.capacity ? Number(form.capacity) : null,
        providerId: form.providerId || null,
        basePrice: form.basePrice ? Number(form.basePrice) : null,
        pickupLocation: form.pickupLocation || null,
        dropLocation: form.dropLocation || null,
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
      <div className="flex gap-2 justify-end">
        <Button className="self-start" onClick={openCreate}><FaPlus />Add transport</Button>
        <Button variant="secondary" className="self-start" onClick={() => setBulkImportOpen(true)}><LuImport />Bulk import</Button>
      </div>

      {bulkImportOpen && (
        <BulkImportModal
          entityType="transports"
          label="transport"
          onClose={() => setBulkImportOpen(false)}
          onImported={() => dispatch(fetchTransports())}
        />
      )}

      {status === "loading" && transports.length === 0 ? (
        <LoadingState label="Loading transport…" />
      ) : status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <DataTable
          columns={columns}
          rows={transports}
          rowKey={(t) => t.uid}
          searchPlaceholder="Search transport…"
          emptyMessage="No transport options yet — add your first one."
          actions={(t) => (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => openEdit(t)}>Edit</Button>
              <Button variant="danger" size="sm" disabled={deletingUid === t.uid} onClick={() => handleDelete(t)}>Archive</Button>
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
        title={editing ? "Edit transport" : "Add transport"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <fieldset disabled={saving} className="contents">

            <TextInput label="Pickup Location" value={form.pickupLocation} onChange={(e) => update("pickupLocation", e.target.value)} />
            <TextInput label="Drop Location" value={form.dropLocation} onChange={(e) => update("dropLocation", e.target.value)} />

            <Select
              label="Escape Point"
              options={escapePoints.map((d) => ({ value: d.uid, label: d.name }))}
              value={form.escapePointId}
              onChange={(e) => update("escapePointId", e.target.value)}
              placeholder={escapePoints.length ? "Select an escape point" : "No escape points added yet"}
            />

            <Select
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
            />
            <Select
              label="Vehicle type"
              options={vehicleTypeOptions}
              value={form.vehicleTypeCode}
              onChange={(e) => update("vehicleTypeCode", e.target.value)}
              placeholder={
                vehicleTypeOptions.length
                  ? "Select vehicle type"
                  : "Not applicable"
              }
              disabled={!vehicleTypeOptions.length}
            />
            <TextInput
              label="Capacity"
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => {
                update("capacity", e.target.value);
                setErrors((p) => ({ ...p, capacity: "" }));
              }}
              error={errors.capacity}
            />

            <Select
              label="Provider"
              options={transportProviders.map((p) => ({ value: p.uid, label: p.name }))}
              value={form.providerId}
              onChange={(e) => update("providerId", e.target.value)}
              placeholder={transportProviders.length ? "Select a provider" : "No transport providers yet"}
            />

            <TextInput
              label="Base price (USD)"
              type="number"
              min={0}
              step="0.01"
              value={form.basePrice}
              onChange={(e) => {
                update("basePrice", e.target.value);
                setErrors((p) => ({ ...p, basePrice: "" }));
              }}
              error={errors.basePrice}
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
          </fieldset>

          {formError && (
            <Alert tone="danger" autoClose={false}>
              {formError}
            </Alert>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={saving || (!!editing && !isDirty)} loading={saving} loadingText="Saving…">
              Save transport
            </Button>
            <Button type="button" variant="ghost" disabled={saving} onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
