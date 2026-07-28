"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Body, Caption } from "@/components/ui/Typography";
import type { ItineraryContentItem } from "@/lib/itinerary-content-items";
import type { InclusionExclusionItem, InclusionExclusionType } from "@/lib/inclusion-exclusions";

// Dynamically imported (TipTap/ProseMirror add ~90KB) so the Trip detail page
// doesn't pay for it unless a Terms/Inclusion/Exclusion form is actually opened.
const RichTextEditor = dynamic(() => import("@/components/ui/RichTextEditor").then((m) => m.RichTextEditor), {
  ssr: false,
  loading: () => <div className="h-40 animate-pulse rounded border border-border bg-muted" />,
});

const TYPES: { value: InclusionExclusionType; label: string }[] = [
  { value: "TERMS", label: "Terms & Conditions" },
  { value: "INCLUSION", label: "Inclusions" },
  { value: "EXCLUSION", label: "Exclusions" },
];

function TypeBlock({
  itineraryUid,
  type,
  label,
  items,
  onChanged,
}: {
  itineraryUid: string;
  type: InclusionExclusionType;
  label: string;
  items: ItineraryContentItem[];
  onChanged: () => void;
}) {
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);
  const [selectable, setSelectable] = useState<InclusionExclusionItem[] | null>(null);
  const [pickedUid, setPickedUid] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customHtml, setCustomHtml] = useState("");
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editHtml, setEditHtml] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function openLibraryPicker() {
    setShowLibraryPicker(true);
    if (selectable === null) {
      const res = await fetch(`/api/library/inclusion-exclusions/selectable?itineraryUid=${itineraryUid}&type=${type}`);
      setSelectable(await res.json());
    }
  }

  async function handleAttach() {
    if (!pickedUid) return;
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch("/api/itinerary-content-items/attach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itineraryUid, sourceItemUid: pickedUid }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message ?? "Failed to attach");
      setPickedUid("");
      setShowLibraryPicker(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to attach");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddCustom() {
    if (!customName.trim()) {
      setError("Name is required");
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch("/api/itinerary-content-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itineraryUid, type, name: customName, contentHtml: customHtml }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message ?? "Failed to add");
      setCustomName("");
      setCustomHtml("");
      setShowCustomForm(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setBusy(false);
    }
  }

  function openEdit(item: ItineraryContentItem) {
    setEditingUid(item.uid);
    setEditName(item.name);
    setEditHtml(item.contentHtml ?? "");
  }

  async function handleSaveEdit(uid: string) {
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch(`/api/itinerary-content-items/${uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, contentHtml: editHtml }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setEditingUid(null);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(uid: string) {
    setBusy(true);
    try {
      await fetch(`/api/itinerary-content-items/${uid}`, { method: "DELETE" });
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-border p-3">
      <Caption>{label}</Caption>

      {items.length === 0 && <Body muted>None added yet.</Body>}
      {items.map((item) => (
        <div key={item.uid} className="flex flex-col gap-2 rounded border border-border p-2 text-sm">
          <div className="flex items-center justify-between">
            <Body className="font-medium">{item.name}</Body>
            <div className="flex gap-2">
              <button type="button" onClick={() => openEdit(item)} className="text-primary hover:underline">Edit</button>
              <button type="button" onClick={() => handleRemove(item.uid)} disabled={busy} className="text-danger hover:underline">Remove</button>
            </div>
          </div>
          {editingUid === item.uid ? (
            <div className="flex flex-col gap-2">
              <TextInput label="Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
              <RichTextEditor value={editHtml} onChange={setEditHtml} />
              <div className="flex gap-2">
                <Button size="sm" disabled={busy} onClick={() => handleSaveEdit(item.uid)}>{busy ? "Saving…" : "Save"}</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingUid(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            item.contentHtml && <div className="prose-content text-muted-foreground" dangerouslySetInnerHTML={{ __html: item.contentHtml }} />
          )}
        </div>
      ))}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={openLibraryPicker}>Add from library</Button>
        <Button size="sm" variant="secondary" onClick={() => setShowCustomForm((s) => !s)}>
          {showCustomForm ? "Cancel" : "Add custom"}
        </Button>
      </div>

      {showLibraryPicker && (
        <div className="flex items-end gap-2 rounded border border-border p-2">
          <Select
            label="Pick from library"
            className="flex-1"
            options={(selectable ?? []).map((s) => ({ value: s.uid, label: s.destination ? `${s.name} (${s.destination.name})` : s.name }))}
            value={pickedUid}
            onChange={(e) => setPickedUid(e.target.value)}
            placeholder={selectable === null ? "Loading…" : "Select an item"}
          />
          <Button size="sm" disabled={busy || !pickedUid} onClick={handleAttach}>Attach</Button>
        </div>
      )}

      {showCustomForm && (
        <div className="flex flex-col gap-2 rounded border border-border p-2">
          <TextInput label="Name" value={customName} onChange={(e) => setCustomName(e.target.value)} />
          <RichTextEditor value={customHtml} onChange={setCustomHtml} placeholder="Specific to this trip…" />
          <Button size="sm" disabled={busy} onClick={handleAddCustom} className="self-start">{busy ? "Adding…" : "Add"}</Button>
        </div>
      )}
    </div>
  );
}

export function ItineraryContentSection({ itineraryUid }: { itineraryUid: string }) {
  const [items, setItems] = useState<ItineraryContentItem[] | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itineraryUid]);

  async function load() {
    const res = await fetch(`/api/itinerary-content-items?itineraryUid=${itineraryUid}`);
    setItems(await res.json());
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <Caption>Terms, Inclusions &amp; Exclusions</Caption>
      {items === null ? (
        <Body muted>Loading…</Body>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {TYPES.map((t) => (
            <TypeBlock
              key={t.value}
              itineraryUid={itineraryUid}
              type={t.value}
              label={t.label}
              items={items.filter((i) => i.type === t.value)}
              onChanged={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
