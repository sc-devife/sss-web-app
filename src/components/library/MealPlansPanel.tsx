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
import type { MealPlan } from "@/lib/meal-plans";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useIsDirty } from "@/lib/forms";
import { required, runValidators } from "@/lib/validators";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMealPlans, createMealPlan, updateMealPlan, deleteMealPlan } from "@/features/mealPlans/mealPlansThunks";
import { selectMealPlans, selectMealPlansStatus, selectMealPlansError } from "@/features/mealPlans/mealPlansSelectors";
import { FaPlus } from "react-icons/fa";

const emptyForm = { code: "", name: "", description: "", isActive: true };
type FormState = typeof emptyForm;

function validate(v: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  const codeErr = runValidators(v.code, [required("Code is required")]);
  if (codeErr) errors.code = codeErr;
  const nameErr = runValidators(v.name, [required("Name is required")]);
  if (nameErr) errors.name = nameErr;
  return errors;
}

export function MealPlansPanel() {
  const dispatch = useAppDispatch();
  const mealPlans = useAppSelector(selectMealPlans);
  const status = useAppSelector(selectMealPlansStatus);
  const error = useAppSelector(selectMealPlansError);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MealPlan | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [original, setOriginal] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | undefined>();

  useEffect(() => {
    dispatch(fetchMealPlans());
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

  function openEdit(mealPlan: MealPlan) {
    const snapshot: FormState = {
      code: mealPlan.code,
      name: mealPlan.name,
      description: mealPlan.description ?? "",
      isActive: mealPlan.isActive,
    };
    setEditing(mealPlan);
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
        await dispatch(updateMealPlan({ uid: editing.uid, payload: form })).unwrap();
      } else {
        await dispatch(createMealPlan(form)).unwrap();
      }
      dispatch(fetchMealPlans());
      setModalOpen(false);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save meal plan"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(mealPlan: MealPlan) {
    setDeletingUid(mealPlan.uid);
    try {
      await dispatch(deleteMealPlan(mealPlan.uid)).unwrap();
      dispatch(fetchMealPlans());
    } finally {
      setDeletingUid(null);
    }
  }

  const columns: DataTableColumn<MealPlan>[] = [
    { key: "code", header: "Code", render: (m) => m.code, sortValue: (m) => m.code, filterValue: (m) => m.code },
    { key: "name", header: "Name", render: (m) => m.name, sortValue: (m) => m.name.toLowerCase(), filterValue: (m) => m.name },
    { key: "description", header: "Description", render: (m) => m.description ?? "—" },
    {
      key: "isActive",
      header: "Status",
      render: (m) => <Badge tone={m.isActive ? "success" : "danger"}>{m.isActive ? "Active" : "Inactive"}</Badge>,
      sortValue: (m) => (m.isActive ? 1 : 0),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button className="self-start" onClick={openCreate}><FaPlus />Add meal plan</Button>
      </div>

      {status === "loading" && mealPlans.length === 0 ? (
        <LoadingState label="Loading meal plans…" />
      ) : status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <DataTable
          columns={columns}
          rows={mealPlans}
          rowKey={(m) => m.uid}
          searchPlaceholder="Search meal plans…"
          emptyMessage="No meal plans yet — add your first one."
          actions={(m) => (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => openEdit(m)}>Edit</Button>
              <Button variant="danger" size="sm" disabled={deletingUid === m.uid} onClick={() => handleDelete(m)}>Delete</Button>
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
        title={editing ? "Edit meal plan" : "Add meal plan"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <fieldset disabled={saving} className="contents">
            <TextInput
              label="Code"
              placeholder="e.g. CP, MAP, AP, EP"
              value={form.code}
              onChange={(e) => update("code", e.target.value.toUpperCase())}
              error={errors.code}
              required
            />
            <TextInput
              label="Name"
              placeholder="e.g. Continental Plan"
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
              Save meal plan
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
