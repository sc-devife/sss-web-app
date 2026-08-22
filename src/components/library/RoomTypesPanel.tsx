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
import type { RoomType } from "@/lib/room-types";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useIsDirty } from "@/lib/forms";
import { required, runValidators } from "@/lib/validators";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchRoomTypes, createRoomType, updateRoomType, deleteRoomType } from "@/features/roomTypes/roomTypesThunks";
import { selectRoomTypes, selectRoomTypesStatus, selectRoomTypesError } from "@/features/roomTypes/roomTypesSelectors";
import { FaPlus } from "react-icons/fa";

const emptyForm = { name: "", description: "", isActive: true };
type FormState = typeof emptyForm;

function validate(v: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  const nameErr = runValidators(v.name, [required("Name is required")]);
  if (nameErr) errors.name = nameErr;
  return errors;
}

export function RoomTypesPanel() {
  const dispatch = useAppDispatch();
  const roomTypes = useAppSelector(selectRoomTypes);
  const status = useAppSelector(selectRoomTypesStatus);
  const error = useAppSelector(selectRoomTypesError);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RoomType | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [original, setOriginal] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | undefined>();

  useEffect(() => {
    dispatch(fetchRoomTypes());
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

  function openEdit(roomType: RoomType) {
    const snapshot: FormState = {
      name: roomType.name,
      description: roomType.description ?? "",
      isActive: roomType.isActive,
    };
    setEditing(roomType);
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
        await dispatch(updateRoomType({ uid: editing.uid, payload: form })).unwrap();
      } else {
        await dispatch(createRoomType(form)).unwrap();
      }
      dispatch(fetchRoomTypes());
      setModalOpen(false);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save room type"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(roomType: RoomType) {
    setDeletingUid(roomType.uid);
    try {
      await dispatch(deleteRoomType(roomType.uid)).unwrap();
      dispatch(fetchRoomTypes());
    } finally {
      setDeletingUid(null);
    }
  }

  const columns: DataTableColumn<RoomType>[] = [
    { key: "name", header: "Name", render: (r) => r.name, sortValue: (r) => r.name.toLowerCase(), filterValue: (r) => r.name },
    { key: "description", header: "Description", render: (r) => r.description ?? "—" },
    {
      key: "isActive",
      header: "Status",
      render: (r) => <Badge tone={r.isActive ? "success" : "danger"}>{r.isActive ? "Active" : "Inactive"}</Badge>,
      sortValue: (r) => (r.isActive ? 1 : 0),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button className="self-start" onClick={openCreate}><FaPlus />Add room type</Button>
      </div>

      {status === "loading" && roomTypes.length === 0 ? (
        <LoadingState label="Loading room types…" />
      ) : status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <DataTable
          columns={columns}
          rows={roomTypes}
          rowKey={(r) => r.uid}
          searchPlaceholder="Search room types…"
          emptyMessage="No room types yet — add your first one."
          actions={(r) => (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => openEdit(r)}>Edit</Button>
              <Button variant="danger" size="sm" disabled={deletingUid === r.uid} onClick={() => handleDelete(r)}>Delete</Button>
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
        title={editing ? "Edit room type" : "Add room type"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <fieldset disabled={saving} className="contents">
            <TextInput
              label="Name"
              placeholder="e.g. Deluxe Room"
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
              Save room type
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
