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
import { Body } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import type { Activity } from "@/lib/activities";
import type { Destination } from "@/lib/destinations";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchActivities, createActivity, updateActivity, deleteActivity } from "@/features/activities/activitiesThunks";
import { selectActivities, selectActivitiesStatus, selectActivitiesError } from "@/features/activities/activitiesSelectors";

const CATEGORY_OPTIONS = [
  { value: "water_sports", label: "Water Sports" },
  { value: "sightseeing", label: "Sightseeing" },
  { value: "adventure", label: "Adventure" },
];

const emptyForm = {
  name: "",
  destinationId: "",
  categoryCode: "",
  durationMinutes: "",
  description: "",
  images: [] as string[],
  basePrice: "",
  status: "active",
};

type FormState = typeof emptyForm;

export function ActivitiesPanel({
  destinations,
}: {
  destinations: Destination[];
}) {
  const dispatch = useAppDispatch();
  const activities = useAppSelector(selectActivities);
  const status = useAppSelector(selectActivitiesStatus);
  const error = useAppSelector(selectActivitiesError);

  const [modalOpen, setModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
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
    setFormError(undefined);
    setModalOpen(true);
  }

  function openEdit(activity: Activity) {
    setEditing(activity);
    setForm({
      name: activity.name,
      destinationId: activity.destination?.uid ?? "",
      categoryCode: activity.categoryCode ?? "",
      durationMinutes: activity.durationMinutes ? String(activity.durationMinutes) : "",
      description: activity.description ?? "",
      images: activity.images ?? [],
      basePrice: activity.basePrice != null ? String(activity.basePrice) : "",
      status: activity.status ?? "active",
    });
    setFormError(undefined);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(undefined);
    try {
      const payload = {
        name: form.name,
        destinationId: form.destinationId || null,
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
      key: "destination",
      header: "Destination",
      render: (a) => a.destination?.name ?? "—",
      filterValue: (a) => a.destination?.name ?? "",
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
        <Button className="self-start" onClick={openCreate}>Add activity</Button>
        <Button variant="secondary" className="self-start" onClick={() => setBulkImportOpen(true)}>Bulk import</Button>
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
          actions={(a) => (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => openEdit(a)}>Edit</Button>
              <Button variant="danger" size="sm" disabled={deletingUid === a.uid} onClick={() => handleDelete(a)}>Archive</Button>
            </div>
          )}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit activity" : "Add activity"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextInput label="Name" value={form.name} onChange={(e) => update("name", e.target.value)} required />

          <Select
            label="Destination"
            options={destinations.map((d) => ({ value: d.uid, label: d.name }))}
            value={form.destinationId}
            onChange={(e) => update("destinationId", e.target.value)}
            placeholder="Select a destination"
          />

          <Select
            label="Category"
            options={CATEGORY_OPTIONS}
            value={form.categoryCode}
            onChange={(e) => update("categoryCode", e.target.value)}
            placeholder="Select a category"
          />

          <TextInput label="Duration (minutes)" type="number" min={1} value={form.durationMinutes} onChange={(e) => update("durationMinutes", e.target.value)} />

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

          {formError && <p className="text-sm text-danger">{formError}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save activity"}</Button>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
