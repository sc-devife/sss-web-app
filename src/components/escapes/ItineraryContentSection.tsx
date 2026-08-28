"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState, Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import type { ItineraryContentItem } from "@/lib/itinerary-content-items";
import type { InclusionExclusionType } from "@/lib/inclusion-exclusions";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchItineraryContentItems,
  attachItineraryContentItem,
  createItineraryContentItem,
  updateItineraryContentItem,
  deleteItineraryContentItem,
} from "@/features/itineraryContentItems/itineraryContentItemsThunks";
import {
  selectItineraryContentItems,
  selectItineraryContentItemsStatus,
} from "@/features/itineraryContentItems/itineraryContentItemsSelectors";
import { fetchSelectableInclusionExclusions } from "@/features/inclusionExclusions/inclusionExclusionsThunks";
import {
  selectSelectableInclusionExclusions,
  selectSelectableInclusionExclusionsStatus,
} from "@/features/inclusionExclusions/inclusionExclusionsSelectors";

// Dynamically imported (TipTap/ProseMirror add ~90KB) so the Escape detail page
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
  const dispatch = useAppDispatch();
  const selectable = useAppSelector((s) => selectSelectableInclusionExclusions(s, itineraryUid, type));
  const selectableStatus = useAppSelector((s) => selectSelectableInclusionExclusionsStatus(s, itineraryUid, type));

  const [showLibraryPicker, setShowLibraryPicker] = useState(false);
  const [pickedUid, setPickedUid] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customHtml, setCustomHtml] = useState("");
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editHtml, setEditHtml] = useState("");
  const [busy, setBusy] = useState(false);
  const [removingUid, setRemovingUid] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  function openLibraryPicker() {
    setShowLibraryPicker(true);
    if (selectableStatus === "idle") {
      dispatch(fetchSelectableInclusionExclusions({ itineraryUid, type }));
    }
  }

  async function handleAttach() {
    if (!pickedUid) return;
    setBusy(true);
    setError(undefined);
    try {
      await dispatch(attachItineraryContentItem({ itineraryUid, sourceItemUid: pickedUid })).unwrap();
      setPickedUid("");
      setShowLibraryPicker(false);
      onChanged();
    } catch (err) {
      setError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to attach"));
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
      await dispatch(createItineraryContentItem({ itineraryUid, type, name: customName, contentHtml: customHtml })).unwrap();
      setCustomName("");
      setCustomHtml("");
      setShowCustomForm(false);
      onChanged();
    } catch (err) {
      setError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to add"));
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
      await dispatch(updateItineraryContentItem({ uid, itineraryUid, name: editName, contentHtml: editHtml })).unwrap();
      setEditingUid(null);
      onChanged();
    } catch (err) {
      setError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save"));
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(uid: string) {
    setBusy(true);
    setRemovingUid(uid);
    try {
      await dispatch(deleteItineraryContentItem({ uid, itineraryUid }));
      onChanged();
    } finally {
      setBusy(false);
      setRemovingUid(null);
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
              <button
                type="button"
                onClick={() => handleRemove(item.uid)}
                disabled={busy}
                className="flex items-center gap-1.5 text-danger hover:underline disabled:no-underline"
              >
                {removingUid === item.uid ? <Spinner size="sm" tone="danger" /> : "Remove"}
              </button>
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
            options={selectable.map((s) => ({ value: s.uid, label: s.escapePoint ? `${s.name} (${s.escapePoint.name})` : s.name }))}
            value={pickedUid}
            onChange={(e) => setPickedUid(e.target.value)}
            placeholder={selectableStatus === "loading" ? "Loading…" : "Select an item"}
          />
          <Button size="sm" disabled={busy || !pickedUid} onClick={handleAttach}>Attach</Button>
        </div>
      )}

      {showCustomForm && (
        <div className="flex flex-col gap-2 rounded border border-border p-2">
          <TextInput label="Name" value={customName} onChange={(e) => setCustomName(e.target.value)} />
          <RichTextEditor value={customHtml} onChange={setCustomHtml} placeholder="Specific to this escape…" />
          <Button size="sm" disabled={busy} onClick={handleAddCustom} className="self-start">{busy ? "Adding…" : "Add"}</Button>
        </div>
      )}
    </div>
  );
}

export function ItineraryContentSection({
  itineraryUid,
  types = TYPES.map((t) => t.value),
}: {
  itineraryUid: string;
  /** Restrict which of Terms/Inclusions/Exclusions render — lets the
   * Itinerary card's Terms tab and Inclusions & Exclusions tab each show
   * just their own slice instead of always all three together. */
  types?: InclusionExclusionType[];
}) {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => selectItineraryContentItems(s, itineraryUid));
  const status = useAppSelector((s) => selectItineraryContentItemsStatus(s, itineraryUid));

  useEffect(() => {
    dispatch(fetchItineraryContentItems(itineraryUid));
  }, [dispatch, itineraryUid]);

  function load() {
    dispatch(fetchItineraryContentItems(itineraryUid));
  }

  const visibleTypes = TYPES.filter((t) => types.includes(t.value));

  if (status === "loading" && items.length === 0) {
    return <LoadingState />;
  }

  return (
    <div className={cn("grid grid-cols-1 gap-3", visibleTypes.length > 1 && "lg:grid-cols-2")}>
      {visibleTypes.map((t) => (
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
  );
}
