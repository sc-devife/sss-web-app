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
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { resolveFileUrl } from "@/lib/files";
import type { Destination } from "@/lib/destinations";
import type { ReferenceOption } from "@/lib/reference-data";
import { fetchCountryOptions, fetchRegionOptions, fetchCityOptions } from "@/lib/reference-data-client";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchDestinations, createDestination, updateDestination, deleteDestination } from "@/features/destinations/destinationsThunks";
import { selectDestinations, selectDestinationsStatus, selectDestinationsError } from "@/features/destinations/destinationsSelectors";

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

export function DestinationsPanel() {
  const dispatch = useAppDispatch();
  const destinations = useAppSelector(selectDestinations);
  const status = useAppSelector(selectDestinationsStatus);
  const error = useAppSelector(selectDestinationsError);

  const [modalOpen, setModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [viewing, setViewing] = useState<Destination | null>(null);
  const [editing, setEditing] = useState<Destination | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [deletingUid, setDeletingUid] = useState<string | null>(null);

  const [countryOptions, setCountryOptions] = useState<ReferenceOption[]>([]);
  const [regionOptions, setRegionOptions] = useState<ReferenceOption[]>([]);
  const [cityOptions, setCityOptions] = useState<ReferenceOption[]>([]);

  useEffect(() => {
    dispatch(fetchDestinations());
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
    setFormError(undefined);
    setModalOpen(true);
  }

  function openEdit(destination: Destination) {
    setEditing(destination);
    setForm({
      id: destination.id,
      name: destination.name,
      countryCode: destination.countryCode ?? "",
      regionCode: destination.regionCode ?? "",
      cityCode: destination.cityCode ?? "",
      description: destination.description ?? "",
      images: destination.images ?? [],
      status: destination.status ?? "active",
    });
    setFormError(undefined);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(undefined);
    try {
      if (editing) {
        await dispatch(updateDestination({ uid: editing.uid, payload: form })).unwrap();
      } else {
        await dispatch(createDestination(form)).unwrap();
      }
      dispatch(fetchDestinations());
      setModalOpen(false);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save destination"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(destination: Destination) {
    setDeletingUid(destination.uid);
    try {
      await dispatch(deleteDestination(destination.uid));
      dispatch(fetchDestinations());
    } finally {
      setDeletingUid(null);
    }
  }

  const columns: DataTableColumn<Destination>[] = [
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
        <Button className="self-start" onClick={openCreate}>Add destination</Button>
        <Button variant="secondary" className="self-start" onClick={() => setBulkImportOpen(true)}>Bulk import</Button>
      </div>

      {bulkImportOpen && (
        <BulkImportModal
          entityType="destinations"
          label="destinations"
          onClose={() => setBulkImportOpen(false)}
          onImported={() => dispatch(fetchDestinations())}
        />
      )}

      {status === "loading" && destinations.length === 0 ? (
        <LoadingState label="Loading destinations…" />
      ) : status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <DataTable
          columns={columns}
          rows={destinations}
          rowKey={(d) => d.uid}
          searchPlaceholder="Search destinations…"
          emptyMessage="No destinations yet — add your first one."
          actions={(d) => (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => openEdit(d)}>Edit</Button>
              <Button variant="danger" size="sm" disabled={deletingUid === d.uid} onClick={() => handleDelete(d)}>Archive</Button>
            </div>
          )}
        />
      )}

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.name ?? "Destination"}>
        {viewing && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Caption>Destination Code</Caption>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit destination" : "Add destination"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextInput
            label="Code"
            value={form.id}
            onChange={(e) => update("id", e.target.value)}
            disabled={!!editing}
            required
          />
          <TextInput label="Name" value={form.name} onChange={(e) => update("name", e.target.value)} required />

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

          {formError && <p className="text-sm text-danger">{formError}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save destination"}</Button>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
