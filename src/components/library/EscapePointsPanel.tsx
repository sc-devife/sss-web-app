"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { FileUpload } from "@/components/ui/FileUpload";
import { BulkImportModal } from "@/components/library/BulkImportModal";
import { Alert } from "@/components/ui/Alert";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { resolveFileUrl } from "@/lib/files";
import type { EscapePoint } from "@/lib/escape-points";
import type { LibraryLocation } from "@/lib/locations";
import { fetchCurrencyOptions } from "@/lib/reference-data-client";
import type { ReferenceOption } from "@/lib/reference-data";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useIsDirty } from "@/lib/forms";
import { notDuplicate, required, runValidators } from "@/lib/validators";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchEscapePoints, createEscapePoint, updateEscapePoint, updateEscapePointLocations, deleteEscapePoint } from "@/features/escapePoints/escapePointsThunks";
import { selectEscapePoints, selectEscapePointsStatus, selectEscapePointsError } from "@/features/escapePoints/escapePointsSelectors";
import { FaPlus } from "react-icons/fa";
import { LuImport } from "react-icons/lu";
import { FaLocationDot } from "react-icons/fa6";

const emptyForm = {
  id: "",
  name: "",
  description: "",
  images: [] as string[],
  status: "active",
  nearest_airport: "",
  currency: "",
  time_zone: "",
};

type FormState = typeof emptyForm;

function validate(v: FormState, escapePoints: EscapePoint[], editingUid?: string): Record<string, string> {
  const errors: Record<string, string> = {};
  const idErr = runValidators(v.id, [
    required("Escape Point code is required"),
    notDuplicate(escapePoints, (d) => d.id, "This code is already in use", editingUid, (d) => d.uid),
  ]);
  if (idErr) errors.id = idErr;
  const nameErr = runValidators(v.name, [required("Name is required")]);
  if (nameErr) errors.name = nameErr;
  return errors;
}

export function EscapePointsPanel({ locations }: { locations: LibraryLocation[] }) {
  const dispatch = useAppDispatch();
  const escapePoints = useAppSelector(selectEscapePoints);
  const status = useAppSelector(selectEscapePointsStatus);
  const error = useAppSelector(selectEscapePointsError);

  const [modalOpen, setModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [viewing, setViewing] = useState<EscapePoint | null>(null);
  const [editing, setEditing] = useState<EscapePoint | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [original, setOriginal] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [deletingUid, setDeletingUid] = useState<string | null>(null);

  const [currencyOptions, setCurrencyOptions] = useState<ReferenceOption[]>([]);

  // Managing which cities a destination covers is a separate action from
  // editing its own fields — a distinct endpoint (PUT {uid}/locations),
  // same "separate editor" pattern as Users' role/team editors.
  const [managingLocations, setManagingLocations] = useState<EscapePoint | null>(null);
  const [selectedLocationUids, setSelectedLocationUids] = useState<string[]>([]);
  const [primaryLocationUid, setPrimaryLocationUid] = useState("");
  const [savingLocations, setSavingLocations] = useState(false);
  const [locationsError, setLocationsError] = useState<string | undefined>();

  useEffect(() => {
    dispatch(fetchEscapePoints());
  }, [dispatch]);

  useEffect(() => {
    fetchCurrencyOptions().then(setCurrencyOptions);
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openLocations(escapePoint: EscapePoint) {
    setManagingLocations(escapePoint);
    setSelectedLocationUids(escapePoint.locations.map((l) => l.uid));
    setPrimaryLocationUid(escapePoint.locations.find((l) => l.isPrimary)?.uid ?? "");
    setLocationsError(undefined);
  }

  async function handleSaveLocations() {
    if (!managingLocations) return;
    setSavingLocations(true);
    setLocationsError(undefined);
    try {
      await dispatch(
        updateEscapePointLocations({
          uid: managingLocations.uid,
          locationUids: selectedLocationUids,
          primaryLocationUid: primaryLocationUid || null,
        }),
      ).unwrap();
      dispatch(fetchEscapePoints());
      setManagingLocations(null);
    } catch (err) {
      setLocationsError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save locations"));
    } finally {
      setSavingLocations(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOriginal(null);
    setErrors({});
    setFormError(undefined);
    setModalOpen(true);
  }

  function openEdit(escapePoint: EscapePoint) {
    const snapshot: FormState = {
      id: escapePoint.id,
      name: escapePoint.name,
      description: escapePoint.description ?? "",
      images: escapePoint.images ?? [],
      status: escapePoint.status ?? "active",
      nearest_airport: escapePoint.nearest_airport ?? "",
      currency: escapePoint.currency ?? "",
      time_zone: escapePoint.time_zone ?? "",
    };
    setEditing(escapePoint);
    setForm(snapshot);
    setOriginal({ ...snapshot, images: [...snapshot.images] });
    setErrors({});
    setFormError(undefined);
    setModalOpen(true);
  }

  const isDirty = useIsDirty(original, form);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editing && !isDirty) return;
    setFormError(undefined);

    const nextErrors = validate(form, escapePoints, editing?.uid);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (editing) {
        await dispatch(updateEscapePoint({ uid: editing.uid, payload: form })).unwrap();
      } else {
        await dispatch(createEscapePoint(form)).unwrap();
      }
      dispatch(fetchEscapePoints());
      setModalOpen(false);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save escape point"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(escapePoint: EscapePoint) {
    setDeletingUid(escapePoint.uid);
    try {
      await dispatch(deleteEscapePoint(escapePoint.uid));
      dispatch(fetchEscapePoints());
    } finally {
      setDeletingUid(null);
    }
  }

  const columns: DataTableColumn<EscapePoint>[] = [
    {
      key: "name",
      header: "Name",
      render: (d) => (
        <button
          type="button"
          onClick={() => setViewing(d)}
          className="font-medium text-primary hover:underline"
        >
          {d.name}
        </button>
      ),
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
      <div className="flex gap-2 justify-end">
        <Button className="self-start" onClick={openCreate}><FaPlus />Add escape point</Button>
        <Button variant="secondary" className="self-start" onClick={() => setBulkImportOpen(true)}><LuImport size={18} />Bulk import</Button>
      </div>

      {bulkImportOpen && (
        <BulkImportModal
          entityType="escape-points"
          label="escape points"
          onClose={() => setBulkImportOpen(false)}
          onImported={() => dispatch(fetchEscapePoints())}
        />
      )}

      {status === "loading" && escapePoints.length === 0 ? (
        <LoadingState label="Loading escape points…" />
      ) : status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <DataTable
          columns={columns}
          rows={escapePoints}
          rowKey={(d) => d.uid}
          searchPlaceholder="Search escape points…"
          emptyMessage="No escape points yet — add your first one."
          onRowClick={(d) => setViewing(d)}
          getRowLabel={(d) => d.name}
          rowMenuActions={(d) => [
            { key: "edit", label: "Edit", onSelect: () => openEdit(d) },
            { key: "locations", label: "Locations", onSelect: () => openLocations(d) },
            { key: "archive", label: "Archive", tone: "danger", disabled: deletingUid === d.uid, onSelect: () => handleDelete(d) },
          ]}
        />
      )}

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.name ?? "Escape Point"}
      >
        {viewing && (
          <div className="flex max-h-[65vh] flex-col">
            {/* Content */}
            <div className="overflow-y-auto pr-1">
              {/* Hero Image */}
              {viewing.images && viewing.images.length > 0 ? (
                <div className="relative overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveFileUrl(viewing.images[0])}
                    alt={viewing.name}
                    className="h-56 w-full object-cover"
                  />

                  {/* Image count */}
                  {viewing.images.length > 1 && (
                    <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      {viewing.images.length} images
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-56 items-center justify-center rounded-xl border border-border bg-muted/30">
                  <div className="text-center">
                    <div className="text-sm font-medium text-muted-foreground">
                      No image available
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground/70">
                      No images uploaded
                    </div>
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="mt-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    {viewing.name}
                  </h2>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Escape Point
                    </span>

                    <span className="text-muted-foreground/40">•</span>

                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {viewing.id}
                    </span>
                  </div>
                </div>

                <Badge
                  tone={viewing.status === "archived" ? "danger" : "success"}
                >
                  {viewing.status ?? "active"}
                </Badge>
              </div>

              {/* Location */}
              <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
                <div className="mt-1 flex items-start gap-2">
                  <span className="mt-0.5 text-muted-foreground"><FaLocationDot /></span>

                  <Body className="font-medium">
                    {viewing.locationLabel || "No location available"}
                  </Body>
                </div>
                {viewing.locations.length > 1 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {viewing.locations.map((l) => (
                      <Badge key={l.uid} tone={l.isPrimary ? "success" : "neutral"}>
                        {l.city}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mt-4">
                <Caption>About this Escape Point</Caption>

                <Body className="mt-1 whitespace-pre-wrap leading-6">
                  {viewing.description || "No description available."}
                </Body>
              </div>

              {/* Details */}
              <div className="mt-4">
                <Caption>Details</Caption>

                <div className="mt-1 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-background p-3">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Escape Point Code
                    </div>

                    <div className="mt-1 text-sm font-semibold text-foreground">
                      {viewing.id}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-background p-3">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Status
                    </div>

                    <div className="mt-1">
                      <Badge
                        tone={
                          viewing.status === "archived"
                            ? "danger"
                            : "success"
                        }
                      >
                        {viewing.status ?? "active"}
                      </Badge>
                    </div>
                  </div>

                  {viewing.nearest_airport && (
                    <div className="rounded-xl border border-border bg-background p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Nearest Airport
                      </div>
                      <div className="mt-1 text-sm font-semibold text-foreground">
                        {viewing.nearest_airport}
                      </div>
                    </div>
                  )}

                  {viewing.currency && (
                    <div className="rounded-xl border border-border bg-background p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Currency
                      </div>
                      <div className="mt-1 text-sm font-semibold text-foreground">
                        {viewing.currency}
                      </div>
                    </div>
                  )}

                  {viewing.time_zone && (
                    <div className="rounded-xl border border-border bg-background p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Time Zone
                      </div>
                      <div className="mt-1 text-sm font-semibold text-foreground">
                        {viewing.time_zone}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Gallery */}
              {viewing.images && viewing.images.length > 1 && (
                <div className="mt-4">
                  <Caption>Gallery</Caption>

                  <div className="mt-1 grid grid-cols-4 gap-2">
                    {viewing.images.map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={url}
                        src={resolveFileUrl(url)}
                        alt={viewing.name}
                        className="aspect-square w-full rounded-lg border border-border object-cover transition-transform hover:scale-[1.02]"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 flex shrink-0 justify-end gap-2 border-t border-border pt-4">
              <Button
                variant="secondary"
                onClick={() => setViewing(null)}
              >
                Close
              </Button>

              <Button
                onClick={() => {
                  setViewing(null);
                  openEdit(viewing);
                }}
              >
                Edit Escape Point
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={modalOpen}
        onClose={() => {
          if (saving) return;
          setModalOpen(false);
        }}
        title={editing ? "Edit escape point" : "Add escape point"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <fieldset disabled={saving} className="contents">
            <TextInput
              label="Code"
              value={form.id}
              onChange={(e) => {
                update("id", e.target.value);
                setErrors((p) => ({ ...p, id: "" }));
              }}
              error={errors.id}
              disabled={!!editing}
              required
            />
            <TextInput
              label="Name"
              value={form.name}
              onChange={(e) => {
                update("name", e.target.value);
                setErrors((p) => ({ ...p, name: "" }));
              }}
              error={errors.name}
              required
            />

            {!editing && (
              <Caption className="text-muted-foreground">
                Which cities this destination covers can be set from the &quot;Locations&quot; action once it&apos;s created.
              </Caption>
            )}

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

            <TextInput
              label="Nearest Airport"
              value={form.nearest_airport}
              onChange={(e) => update("nearest_airport", e.target.value)}
              placeholder="e.g. BOM — Chhatrapati Shivaji Maharaj International"
            />
            <Select
              label="Currency"
              options={currencyOptions.map((c) => ({ value: c.code, label: c.label }))}
              value={form.currency}
              onChange={(e) => update("currency", e.target.value)}
              placeholder="Select a currency"
            />
            <TextInput
              label="Time Zone"
              value={form.time_zone}
              onChange={(e) => update("time_zone", e.target.value)}
              placeholder="e.g. Asia/Kolkata"
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
              Save escape point
            </Button>
            <Button type="button" variant="ghost" disabled={saving} onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!managingLocations}
        onClose={() => {
          if (savingLocations) return;
          setManagingLocations(null);
        }}
        title={managingLocations ? `Locations — ${managingLocations.name}` : "Locations"}
      >
        <div className="flex flex-col gap-4">
          <fieldset disabled={savingLocations} className="contents">
            <MultiSelect
              label="Cities this destination covers"
              options={locations.map((l) => ({ value: l.uid, label: l.displayName }))}
              value={selectedLocationUids}
              onChange={(next) => {
                setSelectedLocationUids(next);
                if (!next.includes(primaryLocationUid)) setPrimaryLocationUid("");
              }}
            />
            <Select
              label="Headline / display city"
              options={locations.filter((l) => selectedLocationUids.includes(l.uid)).map((l) => ({ value: l.uid, label: l.displayName }))}
              value={primaryLocationUid}
              onChange={(e) => setPrimaryLocationUid(e.target.value)}
              placeholder="No primary set"
              disabled={selectedLocationUids.length === 0}
            />
          </fieldset>

          {locationsError && (
            <Alert tone="danger" autoClose={false}>
              {locationsError}
            </Alert>
          )}

          <div className="flex gap-2">
            <Button type="button" disabled={savingLocations} loading={savingLocations} loadingText="Saving…" onClick={handleSaveLocations}>
              Save locations
            </Button>
            <Button type="button" variant="ghost" disabled={savingLocations} onClick={() => setManagingLocations(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
