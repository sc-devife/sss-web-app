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
import { resolveFileUrl } from "@/lib/files";
import type { EscapePoint } from "@/lib/escape-points";
import type { ReferenceOption } from "@/lib/reference-data";
import { fetchCountryOptions, fetchRegionOptions, fetchCityOptions } from "@/lib/reference-data-client";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useIsDirty } from "@/lib/forms";
import { notDuplicate, required, runValidators } from "@/lib/validators";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchEscapePoints, createEscapePoint, updateEscapePoint, deleteEscapePoint } from "@/features/escapePoints/escapePointsThunks";
import { selectEscapePoints, selectEscapePointsStatus, selectEscapePointsError } from "@/features/escapePoints/escapePointsSelectors";
import { FaPlus } from "react-icons/fa";
import { LuImport } from "react-icons/lu";

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

export function EscapePointsPanel() {
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

  const [countryOptions, setCountryOptions] = useState<ReferenceOption[]>([]);
  const [regionOptions, setRegionOptions] = useState<ReferenceOption[]>([]);
  const [cityOptions, setCityOptions] = useState<ReferenceOption[]>([]);

  useEffect(() => {
    dispatch(fetchEscapePoints());
  }, [dispatch]);

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
    setOriginal(null);
    setErrors({});
    setFormError(undefined);
    setModalOpen(true);
  }

  function openEdit(escapePoint: EscapePoint) {
    const snapshot: FormState = {
      id: escapePoint.id,
      name: escapePoint.name,
      countryCode: escapePoint.countryCode ?? "",
      regionCode: escapePoint.regionCode ?? "",
      cityCode: escapePoint.cityCode ?? "",
      description: escapePoint.description ?? "",
      images: escapePoint.images ?? [],
      status: escapePoint.status ?? "active",
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
          actions={(d) => (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => openEdit(d)}>Edit</Button>
              <Button variant="danger" size="sm" disabled={deletingUid === d.uid} onClick={() => handleDelete(d)}>Archive</Button>
            </div>
          )}
        />
      )}

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.name ?? "Escape Point"}>
        {viewing && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Caption>Escape Point Code</Caption>
                <Body className="font-medium">{viewing.id}</Body>
              </div>
              <div>
                <Caption>Name</Caption>
                <Body className="font-medium">{viewing.name}</Body>
              </div>
              <div className="col-span-2">
                <Caption>Address</Caption>
                <Body className="font-medium">{viewing.locationLabel || "—"}</Body>
              </div>
              <div>
                <Caption>Status</Caption>
                <div className="mt-0.5">
                  <Badge tone={viewing.status === "archived" ? "danger" : "success"}>{viewing.status ?? "active"}</Badge>
                </div>
              </div>
            </div>

            <div>
              <Caption>Description</Caption>
              <Body className="mt-0.5 whitespace-pre-wrap">{viewing.description || "—"}</Body>
            </div>

            <div>
              <Caption>Images</Caption>
              {viewing.images && viewing.images.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {viewing.images.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={url}
                      src={resolveFileUrl(url)}
                      alt={viewing.name}
                      className="h-20 w-20 rounded border border-border object-cover"
                    />
                  ))}
                </div>
              ) : (
                <Body muted className="mt-0.5">No images uploaded.</Body>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() => { setViewing(null); openEdit(viewing); }}
              >
                Edit
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
    </div>
  );
}
