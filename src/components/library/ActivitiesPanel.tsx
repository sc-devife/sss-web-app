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
import { Body } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import type { Activity } from "@/lib/activities";
import type { EscapePoint } from "@/lib/escape-points";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useIsDirty } from "@/lib/forms";
import { positiveNumber, required, runValidators } from "@/lib/validators";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchActivities, createActivity, updateActivity, deleteActivity } from "@/features/activities/activitiesThunks";
import { selectActivities, selectActivitiesStatus, selectActivitiesError } from "@/features/activities/activitiesSelectors";
import { FaPlus } from "react-icons/fa";
import { LuImport } from "react-icons/lu";

const CATEGORY_OPTIONS = [
  { value: "water_sports", label: "Water Sports" },
  { value: "sightseeing", label: "Sightseeing" },
  { value: "adventure", label: "Adventure" },
];

const emptyForm = {
  name: "",
  escapePointId: "",
  categoryCode: "",
  durationMinutes: "",
  description: "",
  images: [] as string[],
  basePrice: "",
  status: "active",
};

type FormState = typeof emptyForm;

function validate(v: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  const nameErr = runValidators(v.name, [required("Name is required")]);
  if (nameErr) errors.name = nameErr;
  const durationErr = runValidators(v.durationMinutes, [positiveNumber("Duration must be a positive number")]);
  if (durationErr) errors.durationMinutes = durationErr;
  const priceErr = runValidators(v.basePrice, [positiveNumber("Base price must be a positive number")]);
  if (priceErr) errors.basePrice = priceErr;
  return errors;
}

export function ActivitiesPanel({
  escapePoints,
}: {
  escapePoints: EscapePoint[];
}) {
  const dispatch = useAppDispatch();
  const activities = useAppSelector(selectActivities);
  const status = useAppSelector(selectActivitiesStatus);
  const error = useAppSelector(selectActivitiesError);

  const [modalOpen, setModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [original, setOriginal] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  useEffect(() => {
    dispatch(fetchActivities());
  }, [dispatch]);

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

  function openEdit(activity: Activity) {
    const snapshot: FormState = {
      name: activity.name,
      escapePointId: activity.escapePoint?.uid ?? "",
      categoryCode: activity.categoryCode ?? "",
      durationMinutes: activity.durationMinutes ? String(activity.durationMinutes) : "",
      description: activity.description ?? "",
      images: activity.images ?? [],
      basePrice: activity.basePrice != null ? String(activity.basePrice) : "",
      status: activity.status ?? "active",
    };
    setEditing(activity);
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

    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        escapePointId: form.escapePointId || null,
        categoryCode: form.categoryCode || null,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
        description: form.description,
        images: form.images,
        basePrice: form.basePrice ? Number(form.basePrice) : null,
        status: form.status,
      };
      if (editing) {
        await dispatch(updateActivity({ uid: editing.uid, payload })).unwrap();
      } else {
        await dispatch(createActivity(payload)).unwrap();
      }
      dispatch(fetchActivities());
      setModalOpen(false);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save activity"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(activity: Activity) {
    setDeletingUid(activity.uid);
    try {
      await dispatch(deleteActivity(activity.uid));
      dispatch(fetchActivities());
    } finally {
      setDeletingUid(null);
    }
  }

  const columns: DataTableColumn<Activity>[] = [
    {
      key: "name",
      header: "Name",
      render: (a) => a.name,
      sortValue: (a) => a.name.toLowerCase(),
      filterValue: (a) => a.name,
    },
    {
      key: "escapePoint",
      header: "Escape Point",
      render: (a) => a.escapePoint?.name ?? "—",
      filterValue: (a) => a.escapePoint?.name ?? "",
    },
    {
      key: "category",
      header: "Category",
      render: (a) => CATEGORY_OPTIONS.find((c) => c.value === a.categoryCode)?.label ?? a.categoryCode ?? "—",
    },
    {
      key: "duration",
      header: "Duration",
      render: (a) => (a.durationMinutes ? `${a.durationMinutes} min` : "—"),
      sortValue: (a) => a.durationMinutes ?? 0,
    },
    {
      key: "basePrice",
      header: "Base price (USD)",
      render: (a) => (a.basePrice != null ? `$${a.basePrice.toFixed(2)}` : "—"),
      sortValue: (a) => a.basePrice ?? 0,
    },
    {
      key: "status",
      header: "Status",
      render: (a) => <Badge tone={a.status === "archived" ? "danger" : "success"}>{a.status ?? "active"}</Badge>,
      sortValue: (a) => a.status ?? "",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 justify-end">
        <Button className="self-start" onClick={openCreate}><FaPlus />Add activity</Button>
        <Button variant="secondary" className="self-start" onClick={() => setBulkImportOpen(true)}><LuImport size={18} />Bulk import</Button>
      </div>

      {bulkImportOpen && (
        <BulkImportModal
          entityType="activities"
          label="activities"
          onClose={() => setBulkImportOpen(false)}
          onImported={() => dispatch(fetchActivities())}
        />
      )}

      {status === "loading" && activities.length === 0 ? (
        <LoadingState label="Loading activities…" />
      ) : status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <DataTable
          columns={columns}
          rows={activities}
          rowKey={(a) => a.uid}
          searchPlaceholder="Search activities…"
          emptyMessage="No activities yet — add your first one."
          onRowClick={(a) => openEdit(a)}
          getRowLabel={(a) => a.name}
          rowMenuActions={(a) => [
            { key: "edit", label: "Edit", onSelect: () => openEdit(a) },
            { key: "archive", label: "Archive", tone: "danger", disabled: deletingUid === a.uid, onSelect: () => handleDelete(a) },
          ]}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          if (saving) return;
          setModalOpen(false);
        }}
        title={editing ? "Edit activity" : "Add activity"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <fieldset disabled={saving} className="contents">
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
              label="Escape Point"
              options={escapePoints.map((d) => ({ value: d.uid, label: d.name }))}
              value={form.escapePointId}
              onChange={(e) => update("escapePointId", e.target.value)}
              placeholder="Select an escape point"
            />

            <Select
              label="Category"
              options={CATEGORY_OPTIONS}
              value={form.categoryCode}
              onChange={(e) => update("categoryCode", e.target.value)}
              placeholder="Select a category"
            />

            <TextInput
              label="Duration (minutes)"
              type="number"
              min={1}
              value={form.durationMinutes}
              onChange={(e) => {
                update("durationMinutes", e.target.value);
                setErrors((p) => ({ ...p, durationMinutes: "" }));
              }}
              error={errors.durationMinutes}
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="activity-description" className="text-sm font-medium text-foreground">Description</label>
              <textarea
                id="activity-description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={3}
                className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>

            <FileUpload label="Images" value={form.images} onChange={(images) => update("images", images)} />

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
              Save activity
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
