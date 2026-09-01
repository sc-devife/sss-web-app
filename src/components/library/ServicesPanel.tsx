"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Body } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import type { Service } from "@/lib/services";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useIsDirty } from "@/lib/forms";
import { required, runValidators } from "@/lib/validators";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchServices, createService, updateService, deleteService } from "@/features/services/servicesThunks";
import { selectServices, selectServicesStatus, selectServicesError } from "@/features/services/servicesSelectors";
import { FaPlus } from "react-icons/fa";

const emptyForm = { name: "", description: "", isActive: true };
type FormState = typeof emptyForm;

function validate(v: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  const nameErr = runValidators(v.name, [required("Name is required")]);
  if (nameErr) errors.name = nameErr;
  return errors;
}

export function ServicesPanel() {
  const dispatch = useAppDispatch();
  const services = useAppSelector(selectServices);
  const status = useAppSelector(selectServicesStatus);
  const error = useAppSelector(selectServicesError);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [original, setOriginal] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | undefined>();

  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((p) => ({ ...p, [key]: "" }));
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOriginal(null);
    setErrors({});
    setFormError(undefined);
    setModalOpen(true);
  }

  function openEdit(service: Service) {
    const snapshot: FormState = {
      name: service.name,
      description: service.description ?? "",
      isActive: service.isActive,
    };
    setEditing(service);
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
        await dispatch(updateService({ uid: editing.uid, payload: form })).unwrap();
      } else {
        await dispatch(createService(form)).unwrap();
      }
      dispatch(fetchServices());
      setModalOpen(false);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save service"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(service: Service) {
    setDeletingUid(service.uid);
    try {
      await dispatch(deleteService(service.uid)).unwrap();
      dispatch(fetchServices());
    } finally {
      setDeletingUid(null);
    }
  }

  const columns: DataTableColumn<Service>[] = [
    { key: "name", header: "Name", render: (s) => s.name, sortValue: (s) => s.name.toLowerCase(), filterValue: (s) => s.name },
    { key: "description", header: "Description", render: (s) => s.description ?? "—" },
    {
      key: "isActive",
      header: "Status",
      render: (s) => <Badge tone={s.isActive ? "success" : "danger"}>{s.isActive ? "Active" : "Inactive"}</Badge>,
      sortValue: (s) => (s.isActive ? 1 : 0),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button className="self-start" onClick={openCreate}><FaPlus />Add service</Button>
      </div>

      {status === "loading" && services.length === 0 ? (
        <LoadingState label="Loading services…" />
      ) : status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <DataTable
          columns={columns}
          rows={services}
          rowKey={(s) => s.uid}
          searchPlaceholder="Search services…"
          emptyMessage="No services yet — add your first one."
          onRowClick={(s) => openEdit(s)}
          getRowLabel={(s) => s.name}
          rowMenuActions={(s) => [
            { key: "edit", label: "Edit", onSelect: () => openEdit(s) },
            { key: "delete", label: "Delete", tone: "danger", disabled: deletingUid === s.uid, onSelect: () => handleDelete(s) },
          ]}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          if (saving) return;
          setModalOpen(false);
        }}
        title={editing ? "Edit service" : "Add service"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <fieldset disabled={saving} className="contents">
            <TextInput
              label="Name"
              placeholder="e.g. Candle Light Dinner"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              error={errors.name}
              required
            />
            <TextInput
              label="Description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
            {editing && (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => update("isActive", e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                Active
              </label>
            )}
          </fieldset>

          {formError && (
            <Alert tone="danger" autoClose={false}>
              {formError}
            </Alert>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={saving || (!!editing && !isDirty)} loading={saving} loadingText="Saving…">
              Save service
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
