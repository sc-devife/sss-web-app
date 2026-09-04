"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Badge } from "@/components/ui/Badge";
import { EscapePointSelect } from "@/components/library/EscapePointSelect";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Body } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import type { InclusionExclusionItem, InclusionExclusionType } from "@/lib/inclusion-exclusions";
import type { EscapePoint } from "@/lib/escape-points";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useIsDirty } from "@/lib/forms";
import { required, runValidators } from "@/lib/validators";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchInclusionExclusions,
  createInclusionExclusion,
  updateInclusionExclusion,
  deactivateInclusionExclusion,
} from "@/features/inclusionExclusions/inclusionExclusionsThunks";
import {
  selectInclusionExclusions,
  selectInclusionExclusionsStatus,
  selectInclusionExclusionsError,
} from "@/features/inclusionExclusions/inclusionExclusionsSelectors";
import { FaPlus } from "react-icons/fa";

// Dynamically imported (TipTap/ProseMirror add ~90KB) so pages that never
// open the create/edit form don't pay for it on first load.
const RichTextEditor = dynamic(() => import("@/components/ui/RichTextEditor").then((m) => m.RichTextEditor), {
  ssr: false,
  loading: () => <div className="h-40 animate-pulse rounded border border-border bg-muted" />,
});

const TABS: { value: InclusionExclusionType; label: string }[] = [
  { value: "TERMS", label: "Terms & Conditions" },
  { value: "INCLUSION", label: "Inclusions" },
  { value: "EXCLUSION", label: "Exclusions" },
];

const emptyForm = { name: "", escapePointId: "", contentHtml: "" };

type FormState = typeof emptyForm;

function isContentEmpty(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").trim().length === 0;
}

function validate(v: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  const nameErr = runValidators(v.name, [required("Name is required")]);
  if (nameErr) errors.name = nameErr;
  if (isContentEmpty(v.contentHtml)) errors.contentHtml = "Content is required";
  return errors;
}

export function InclusionExclusionsPanel({
  escapePoints,
}: {
  escapePoints: EscapePoint[];
}) {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectInclusionExclusions);
  const status = useAppSelector(selectInclusionExclusionsStatus);
  const error = useAppSelector(selectInclusionExclusionsError);

  const [activeTab, setActiveTab] = useState<InclusionExclusionType>("TERMS");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [original, setOriginal] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [deactivatingUid, setDeactivatingUid] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchInclusionExclusions());
  }, [dispatch]);

  const visibleItems = useMemo(
    () => items.filter((i) => i.type === activeTab),
    [items, activeTab],
  );

  function openCreate() {
    setEditingUid(null);
    setForm(emptyForm);
    setOriginal(null);
    setErrors({});
    setFormError(undefined);
    setModalOpen(true);
  }

  function openEdit(item: InclusionExclusionItem) {
    const snapshot: FormState = {
      name: item.name,
      escapePointId: item.escapePointId ?? "",
      contentHtml: item.contentHtml ?? "",
    };
    setEditingUid(item.uid);
    setForm(snapshot);
    setOriginal(snapshot);
    setErrors({});
    setFormError(undefined);
    setModalOpen(true);
  }

  const isDirty = useIsDirty(original, form);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingUid && !isDirty) return;
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
        type: activeTab,
        contentHtml: form.contentHtml,
        escapePointId: form.escapePointId || null,
      };
      if (editingUid) {
        await dispatch(updateInclusionExclusion({ uid: editingUid, payload })).unwrap();
      } else {
        await dispatch(createInclusionExclusion(payload)).unwrap();
      }
      dispatch(fetchInclusionExclusions());
      setModalOpen(false);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(uid: string) {
    setDeactivatingUid(uid);
    try {
      await dispatch(deactivateInclusionExclusion(uid));
      dispatch(fetchInclusionExclusions());
    } finally {
      setDeactivatingUid(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded border border-border p-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === tab.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button onClick={openCreate}> <FaPlus />Add {TABS.find((t) => t.value === activeTab)?.label.replace(/s$/, "")}</Button>
      </div>

      {status === "loading" && items.length === 0 ? (
        <LoadingState />
      ) : status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleItems.length === 0 && <Body muted>Nothing here yet.</Body>}
          {visibleItems.map((item) => (
            <Card key={item.uid} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Body className="font-medium">{item.name}</Body>
                  <Badge tone={item.escapePoint ? "neutral" : "success"}>
                    {item.escapePoint ? item.escapePoint.name : "Org-wide"}
                  </Badge>
                  {!item.isActive && <Badge tone="danger">Inactive</Badge>}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => openEdit(item)} className="text-sm text-primary hover:underline">Edit</button>
                  {item.isActive && (
                    <button type="button" onClick={() => handleDeactivate(item.uid)} disabled={deactivatingUid === item.uid} className="text-sm text-danger hover:underline disabled:opacity-50">Deactivate</button>
                  )}
                </div>
              </div>
              {item.contentHtml && (
                <div className="prose-content text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: item.contentHtml }} />
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          if (saving) return;
          setModalOpen(false);
        }}
        title={editingUid ? "Edit item" : "Add item"}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <fieldset disabled={saving} className="contents">
            <TextInput
              label="Name"
              value={form.name}
              onChange={(e) => {
                setForm((f) => ({ ...f, name: e.target.value }));
                setErrors((p) => ({ ...p, name: "" }));
              }}
              error={errors.name}
              required
            />
            <EscapePointSelect
              label="Escape Point"
              escapePoints={escapePoints}
              value={form.escapePointId}
              onChange={(v) => setForm((f) => ({ ...f, escapePointId: v }))}
            />
            <RichTextEditor
              label="Content"
              value={form.contentHtml}
              onChange={(html) => {
                setForm((f) => ({ ...f, contentHtml: html }));
                setErrors((p) => ({ ...p, contentHtml: "" }));
              }}
              error={errors.contentHtml}
              placeholder="Type here…"
            />
          </fieldset>
          {formError && (
            <Alert tone="danger" autoClose={false}>
              {formError}
            </Alert>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving || (!!editingUid && !isDirty)} loading={saving} loadingText="Saving…">
              Save
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
