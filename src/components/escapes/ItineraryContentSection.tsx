"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Body, Caption } from "@/components/ui/Typography";
import { Spinner } from "@/components/ui/Spinner";
import { Skeleton } from "@/components/ui/Skeleton";
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
  reorderItineraryContentItems,
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
  loading: () => <div className="skeleton h-40 rounded border border-border" />,
});

const TYPES: { value: InclusionExclusionType; label: string }[] = [
  { value: "TERMS", label: "Terms & Conditions" },
  { value: "INCLUSION", label: "Inclusions" },
  { value: "EXCLUSION", label: "Exclusions" },
];

// This list has no dedicated scrollable panel of its own (unlike the
// itinerary day list) — it just flows in the page, which may or may not sit
// inside a bounded, independently-scrolling ancestor depending on viewport
// width (see the lg:-only scroll container elsewhere on this page). Walking
// up for the nearest actually-scrollable element, falling back to the
// window itself, lets auto-scroll work correctly in both cases without
// requiring this component to know which one applies.
type ScrollTarget = HTMLElement | Window;

function findScrollableAncestor(el: HTMLElement | null): ScrollTarget {
  let node = el?.parentElement ?? null;
  while (node) {
    const style = getComputedStyle(node);
    if ((style.overflowY === "auto" || style.overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return window;
}

function scrollTargetRect(target: ScrollTarget): { top: number; bottom: number } {
  if (target === window) return { top: 0, bottom: window.innerHeight };
  const rect = (target as HTMLElement).getBoundingClientRect();
  return { top: rect.top, bottom: rect.bottom };
}

function scrollTargetTop(target: ScrollTarget): number {
  return target === window ? window.scrollY : (target as HTMLElement).scrollTop;
}

function scrollTargetMaxTop(target: ScrollTarget): number {
  if (target === window) return document.documentElement.scrollHeight - window.innerHeight;
  const el = target as HTMLElement;
  return el.scrollHeight - el.clientHeight;
}

function setScrollTargetTop(target: ScrollTarget, value: number) {
  if (target === window) window.scrollTo({ top: value });
  else (target as HTMLElement).scrollTop = value;
}

function TypeBlock({
  itineraryUid,
  type,
  label,
  items,
  allItems,
  onChanged,
}: {
  itineraryUid: string;
  type: InclusionExclusionType;
  label: string;
  items: ItineraryContentItem[];
  // Every content item on this itinerary, all types combined and already
  // ordered by (type, sortOrder) — needed only at drop time, to rebuild the
  // full reorder payload with just this type's slice rearranged (sortOrder
  // is one sequence shared across Terms/Inclusions/Exclusions; see
  // ItineraryContentItemHelper.reorder).
  allItems: ItineraryContentItem[];
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

  // --- Drag-and-drop reordering (within this type's own list only) ---
  // Same live-reorder-while-dragging approach as ItineraryDayPlanner's
  // itinerary items: dragItems is a local copy of `items` that reflows in
  // real time as the pointer crosses other rows — that reflow doubles as
  // the drop-position indicator — while the dragged row itself just rides
  // along with an elevated style at wherever it currently sits.
  const [dragItems, setDragItems] = useState<ItineraryContentItem[] | null>(null);
  const [draggingUid, setDraggingUid] = useState<string | null>(null);
  const dragItemsRef = useRef<ItineraryContentItem[] | null>(null);
  const draggingActiveRef = useRef(false);
  const draggingUidRef = useRef<string | null>(null);
  const pointerYRef = useRef(0);
  const dragRafRef = useRef<number | null>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollTargetRef = useRef<ScrollTarget>(null as unknown as ScrollTarget);
  const reorderingRef = useRef(false);

  function registerRowRef(uid: string, el: HTMLDivElement | null) {
    if (el) rowRefs.current.set(uid, el);
    else rowRefs.current.delete(uid);
  }

  function updateDropTargetFromPointer(pointerY: number, draggedUid: string) {
    const list = dragItemsRef.current;
    if (!list) return;
    const draggedIdx = list.findIndex((it) => it.uid === draggedUid);
    if (draggedIdx === -1) return;
    let targetIdx = list.length;
    for (let i = 0; i < list.length; i++) {
      const el = rowRefs.current.get(list[i].uid);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (pointerY < rect.top + rect.height / 2) {
        targetIdx = i;
        break;
      }
    }
    if (targetIdx === draggedIdx || targetIdx === draggedIdx + 1) return;
    const next = list.slice();
    const [moved] = next.splice(draggedIdx, 1);
    const insertAt = targetIdx > draggedIdx ? targetIdx - 1 : targetIdx;
    next.splice(insertAt, 0, moved);
    dragItemsRef.current = next;
    setDragItems(next);
  }

  // Runs once per frame for the whole drag: auto-scrolls whichever
  // ancestor actually scrolls (see findScrollableAncestor) when the
  // pointer nears its top/bottom edge, and keeps the drop position current
  // even while the pointer itself is held still and only the list is
  // scrolling under it.
  function dragFrame(draggedUid: string) {
    if (!draggingActiveRef.current) {
      dragRafRef.current = null;
      return;
    }
    const target = scrollTargetRef.current;
    const pointerY = pointerYRef.current;
    if (target) {
      const rect = scrollTargetRect(target);
      const threshold = 56;
      let direction = 0;
      let intensity = 0;
      if (pointerY < rect.top + threshold) {
        direction = -1;
        intensity = (rect.top + threshold - pointerY) / threshold;
      } else if (pointerY > rect.bottom - threshold) {
        direction = 1;
        intensity = (pointerY - (rect.bottom - threshold)) / threshold;
      }
      if (direction !== 0) {
        const speed = 4 + Math.min(intensity, 1) * 14;
        const maxTop = scrollTargetMaxTop(target);
        const nextTop = Math.max(0, Math.min(maxTop, scrollTargetTop(target) + direction * speed));
        setScrollTargetTop(target, nextTop);
      }
    }
    updateDropTargetFromPointer(pointerY, draggedUid);
    dragRafRef.current = requestAnimationFrame(() => dragFrame(draggedUid));
  }

  function handleRowPointerDown(e: ReactPointerEvent<HTMLDivElement>, item: ItineraryContentItem) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Let Edit/Remove, form controls, and links behave normally instead of
    // starting a drag — and never drag a row that's actively being edited.
    const target = e.target as HTMLElement;
    if (target.closest("button, input, textarea, select, a, [contenteditable='true']")) return;
    if (editingUid === item.uid) return;
    if (draggingActiveRef.current || reorderingRef.current) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    const initial = items.slice();
    dragItemsRef.current = initial;
    setDragItems(initial);
    setDraggingUid(item.uid);
    draggingUidRef.current = item.uid;
    draggingActiveRef.current = true;
    pointerYRef.current = e.clientY;
    scrollTargetRef.current = findScrollableAncestor(e.currentTarget);
    document.body.style.cursor = "grabbing";
    dragRafRef.current = requestAnimationFrame(() => dragFrame(item.uid));
  }

  function handleRowPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingActiveRef.current) return;
    pointerYRef.current = e.clientY;
    if (draggingUidRef.current) {
      updateDropTargetFromPointer(e.clientY, draggingUidRef.current);
    }
  }

  async function handleRowPointerEnd(e: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingActiveRef.current) return;
    draggingActiveRef.current = false;
    if (dragRafRef.current != null) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }
    document.body.style.cursor = "";
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDraggingUid(null);
    draggingUidRef.current = null;

    const finalOrder = dragItemsRef.current;
    dragItemsRef.current = null;
    if (!finalOrder) {
      setDragItems(null);
      return;
    }

    const changed = finalOrder.length !== items.length || finalOrder.some((it, i) => it.uid !== items[i]?.uid);
    if (!changed) {
      setDragItems(null);
      return;
    }

    // sort_order is one sequence spanning every type on this itinerary
    // (see ItineraryContentItemHelper.reorder), so the payload has to be
    // the full cross-type list with just this type's slice replaced by
    // its new order — Inclusions/Exclusions (or Terms, from the other
    // block) keep exactly the order they already had.
    let typeIdx = 0;
    const orderedItemUids = allItems.map((it) => (it.type === type ? finalOrder[typeIdx++].uid : it.uid));

    setBusy(true);
    reorderingRef.current = true;
    try {
      await dispatch(reorderItineraryContentItems({ itineraryUid, orderedItemUids }));
      // Awaited so dragItems isn't cleared — falling back to the
      // redux-backed `items` — until that order actually matches what the
      // drag just settled on, avoiding a flash back to the pre-drag order.
      await dispatch(fetchItineraryContentItems(itineraryUid));
    } finally {
      reorderingRef.current = false;
      setBusy(false);
      setDragItems(null);
    }
  }

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
      {(dragItems ?? items).map((item) => (
        <div
          key={item.uid}
          ref={(el) => registerRowRef(item.uid, el)}
          onPointerDown={(e) => handleRowPointerDown(e, item)}
          onPointerMove={handleRowPointerMove}
          onPointerUp={handleRowPointerEnd}
          onPointerCancel={handleRowPointerEnd}
          style={{ touchAction: "none" }}
          className={cn(
            "flex cursor-grab select-none flex-col gap-2 rounded border border-border p-2 text-sm transition-shadow",
            draggingUid === item.uid && "relative z-20 cursor-grabbing border-primary/50 shadow-lg ring-2 ring-primary/40",
          )}
        >
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

  if ((status === "idle" || status === "loading") && items.length === 0) {
    // Mirrors TypeBlock's own layout below (label + item cards + action
    // buttons) so the loading state doesn't jump when the real blocks arrive.
    return (
      <div className={cn("grid grid-cols-1 gap-3", visibleTypes.length > 1 && "lg:grid-cols-2")}>
        {visibleTypes.map((t) => (
          <div key={t.value} className="flex flex-col gap-2 rounded border border-border p-3">
            <Skeleton className="h-3 w-24" />
            <div className="flex flex-col gap-2 rounded border border-border p-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-10" />
              </div>
              <Skeleton className="h-3 w-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-32 rounded" />
              <Skeleton className="h-8 w-28 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
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
          allItems={items}
          onChanged={load}
        />
      ))}
    </div>
  );
}
