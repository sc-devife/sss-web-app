"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Body } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import type { InclusionExclusionItem, InclusionExclusionType } from "@/lib/inclusion-exclusions";
import type { Destination } from "@/lib/destinations";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
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

const emptyForm = { name: "", destinationId: "", contentHtml: "" };

export function InclusionExclusionsPanel({
  destinations,
}: {
  destinations: Destination[];
}) {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectInclusionExclusions);
  const status = useAppSelector(selectInclusionExclusionsStatus);
  const error = useAppSelector(selectInclusionExclusionsError);

  const [activeTab, setActiveTab] = useState<InclusionExclusionType>("TERMS");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
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
    setFormError(undefined);
    setModalOpen(true);
  }

  function openEdit(item: InclusionExclusionItem) {
    setEditingUid(item.uid);
    setForm({
      name: item.name,
      destinationId: item.destinationId ?? "",
      contentHtml: item.contentHtml ?? "",
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
        type: activeTab,
        contentHtml: form.contentHtml,
        destinationId: form.destinationId || null,
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
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button onClick={openCreate}>Add {TABS.find((t) => t.value === activeTab)?.label.replace(/s$/, "")}</Button>
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
                  <Badge tone={item.destination ? "neutral" : "success"}>
                    {item.destination ? item.destination.name : "Org-wide"}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingUid ? "Edit item" : "Add item"} className="max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextInput label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Select
            label="Destination"
            options={destinations.map((d) => ({ value: d.uid, label: d.name }))}
            value={form.destinationId}
            onChange={(e) => setForm((f) => ({ ...f, destinationId: e.target.value }))}
            placeholder="Org-wide (no destination)"
          />
          <RichTextEditor
            label="Content"
            value={form.contentHtml}
            onChange={(html) => setForm((f) => ({ ...f, contentHtml: html }))}
            placeholder="Type here…"
          />
          {formError && <p className="text-sm text-danger">{formError}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
