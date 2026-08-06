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
import type { ServiceProvider } from "@/lib/service-providers";
import type { ReferenceOption } from "@/lib/reference-data";
import { fetchCountryOptions } from "@/lib/reference-data-client";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useIsDirty } from "@/lib/forms";
import { required, runValidators } from "@/lib/validators";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchServiceProviders,
  createServiceProvider,
  updateServiceProvider,
  deleteServiceProvider,
} from "@/features/serviceProviders/serviceProvidersThunks";
import {
  selectServiceProviders,
  selectServiceProvidersStatus,
  selectServiceProvidersError,
} from "@/features/serviceProviders/serviceProvidersSelectors";
import { FaPlus } from "react-icons/fa";
import { LuImport } from "react-icons/lu";

const TYPE_OPTIONS = [
  { value: "transport", label: "Transport" },
  { value: "activity", label: "Activity" },
  { value: "guide", label: "Guide" },
  { value: "other", label: "Other" },
];

const emptyForm = {
  name: "",
  typeCode: "transport",
  contactInfo: "",
  countryCode: "",
  status: "active",
};

type FormState = typeof emptyForm;

function validate(v: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  const nameErr = runValidators(v.name, [required("Name is required")]);
  if (nameErr) errors.name = nameErr;
  return errors;
}

export function ServiceProvidersPanel() {
  const dispatch = useAppDispatch();
  const providers = useAppSelector(selectServiceProviders);
  const status = useAppSelector(selectServiceProvidersStatus);
  const error = useAppSelector(selectServiceProvidersError);

  const [modalOpen, setModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceProvider | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [original, setOriginal] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [countryOptions, setCountryOptions] = useState<ReferenceOption[]>([]);

  useEffect(() => {
    dispatch(fetchServiceProviders());
  }, [dispatch]);

  useEffect(() => {
    fetchCountryOptions().then(setCountryOptions);
  }, []);

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

  function openEdit(provider: ServiceProvider) {
    const snapshot: FormState = {
      name: provider.name,
      typeCode: provider.typeCode,
      contactInfo: provider.contactInfo ?? "",
      countryCode: provider.countryCode ?? "",
      status: provider.status ?? "active",
    };
    setEditing(provider);
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
      if (editing) {
        await dispatch(updateServiceProvider({ uid: editing.uid, payload: form })).unwrap();
      } else {
        await dispatch(createServiceProvider(form)).unwrap();
      }
      dispatch(fetchServiceProviders());
      setModalOpen(false);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save service provider"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(provider: ServiceProvider) {
    setDeletingUid(provider.uid);
    try {
      await dispatch(deleteServiceProvider(provider.uid));
      dispatch(fetchServiceProviders());
    } finally {
      setDeletingUid(null);
    }
  }

  const columns: DataTableColumn<ServiceProvider>[] = [
    {
      key: "name",
      header: "Name",
      render: (p) => p.name,
      sortValue: (p) => p.name.toLowerCase(),
      filterValue: (p) => p.name,
    },
    {
      key: "type",
      header: "Type",
      render: (p) => TYPE_OPTIONS.find((t) => t.value === p.typeCode)?.label ?? p.typeCode,
      sortValue: (p) => p.typeCode,
    },
    {
      key: "country",
      header: "Country",
      render: (p) => p.countryLabel || "—",
      filterValue: (p) => p.countryLabel,
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <Badge tone={p.status === "archived" ? "danger" : "success"}>{p.status ?? "active"}</Badge>,
      sortValue: (p) => p.status ?? "",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 justify-end">
        <Button className="self-start" onClick={openCreate}><FaPlus />Add service provider</Button>
        <Button variant="secondary" className="self-start" onClick={() => setBulkImportOpen(true)}><LuImport size={18} />Bulk import</Button>
      </div>

      {bulkImportOpen && (
        <BulkImportModal
          entityType="service-providers"
          label="service providers"
          onClose={() => setBulkImportOpen(false)}
          onImported={() => dispatch(fetchServiceProviders())}
        />
      )}

      {status === "loading" && providers.length === 0 ? (
        <LoadingState label="Loading service providers…" />
      ) : status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <DataTable
          columns={columns}
          rows={providers}
          rowKey={(p) => p.uid}
          searchPlaceholder="Search service providers…"
          emptyMessage="No service providers yet — add your first one."
          actions={(p) => (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => openEdit(p)}>Edit</Button>
              <Button variant="danger" size="sm" disabled={deletingUid === p.uid} onClick={() => handleDelete(p)}>Archive</Button>
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
        title={editing ? "Edit service provider" : "Add service provider"}
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

            <Select label="Type" options={TYPE_OPTIONS} value={form.typeCode} onChange={(e) => update("typeCode", e.target.value)} />

            <TextInput label="Contact info" value={form.contactInfo} onChange={(e) => update("contactInfo", e.target.value)} />

            <Select
              label="Country"
              options={countryOptions.map((c) => ({ value: c.code, label: c.label }))}
              value={form.countryCode}
              onChange={(e) => update("countryCode", e.target.value)}
              placeholder="Select a country"
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
              Save service provider
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
