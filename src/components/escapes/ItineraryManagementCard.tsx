"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { PiCopyFill, PiTrashFill, PiPlusFill, PiPencilSimpleFill, PiSuitcaseRollingFill } from "react-icons/pi";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchItinerariesForEscape, createItinerary, updateItinerary, duplicateItinerary, deleteItinerary } from "@/features/itineraries/itinerariesThunks";
import { selectItineraries, selectItinerariesStatus, selectItinerariesError } from "@/features/itineraries/itinerariesSelectors";

// Compact itinerary list for the right rail. Only shows each itinerary's
// name and duplicate/delete actions — itineraries aren't versioned, each is
// an independent record; day-by-day items, terms/inclusions/exclusions, and
// quotes (previously available by expanding an ItineraryCard) aren't
// rendered on this page for now, reserved for the center panel's future
// functionality. ItineraryCard itself is untouched and still used elsewhere
// its expand/edit flow applies. Escape status advance/cancel controls live
// on the Escape workspace itself, not here.
const STATUS_TONE: Record<string, "neutral" | "success" | "warning"> = {
  draft: "neutral",
  active: "success",
  superseded: "warning",
};

export function ItineraryManagementCard({
  escapeUid,
  selectedUid = null,
  onSelect,
  bare = false,
}: {
  escapeUid: string;
  /** Which itinerary reads as "selected" (drives the Quotes list next to
   * this card) — owned by the parent so it can be shared with that sibling. */
  selectedUid?: string | null;
  onSelect?: (uid: string) => void;
  /** Skip the own Card wrapper — used when embedded inside another panel
   * (see EscapeSidePanel) that already provides the outer border/background. */
  bare?: boolean;
}) {
  const dispatch = useAppDispatch();
  const itineraries = useAppSelector(selectItineraries);
  const itinerariesStatus = useAppSelector(selectItinerariesStatus);
  const itinerariesError = useAppSelector(selectItinerariesError);

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [duplicatingUid, setDuplicatingUid] = useState<string | null>(null);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);

  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [renamingUid, setRenamingUid] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(fetchItinerariesForEscape(escapeUid));
  }, [dispatch, escapeUid]);

  // Default to the first itinerary once the list loads (or the previously
  // selected one disappears), so the Quotes list next to this card always
  // has something to show without the user having to click first.
  useEffect(() => {
    if (!onSelect || itineraries.length === 0) return;
    if (selectedUid && itineraries.some((i) => i.uid === selectedUid)) return;
    const first = itineraries.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))[0];
    if (first) onSelect(first.uid);
  }, [itineraries, selectedUid, onSelect]);

  function refreshItineraries() {
    dispatch(fetchItinerariesForEscape(escapeUid));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(undefined);
    try {
      // A blank name is fine — the backend auto-generates one from the
      // escape's lead name, itinerary count, and trip length.
      await dispatch(createItinerary({ escapeUid, name: name.trim() })).unwrap();
      refreshItineraries();
      setName("");
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to create itinerary"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicate(uid: string) {
    setDuplicatingUid(uid);
    try {
      await dispatch(duplicateItinerary(uid));
      refreshItineraries();
    } finally {
      setDuplicatingUid(null);
    }
  }

  function startEditing(uid: string, currentName: string) {
    setEditingUid(uid);
    setEditValue(currentName);
    requestAnimationFrame(() => editInputRef.current?.select());
  }

  async function commitEdit() {
    const uid = editingUid;
    const trimmed = editValue.trim();
    setEditingUid(null);
    if (!uid) return;
    const original = itineraries.find((i) => i.uid === uid)?.name;
    if (!trimmed || trimmed === original) return;
    setRenamingUid(uid);
    try {
      await dispatch(updateItinerary({ uid, name: trimmed }));
    } finally {
      setRenamingUid(null);
    }
  }

  function handleEditKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setEditingUid(null);
    }
  }

  async function handleDelete(uid: string) {
    setDeletingUid(uid);
    try {
      await dispatch(deleteItinerary(uid));
      refreshItineraries();
    } finally {
      setDeletingUid(null);
    }
  }

  const sortedItineraries = itineraries.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));

  const body = (
    <>
      <div className="relative flex h-full min-h-0 flex-col rounded-xl border border-border pt-4 px-2.5 pb-2.5">
        <span className="absolute -top-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap bg-card px-2 text-xs font-semibold text-foreground">
          <PiSuitcaseRollingFill className="h-3.5 w-3.5 shrink-0" />
          Itineraries
        </span>

        {itinerariesStatus === "loading" && itineraries.length === 0 ? (
        <LoadingState label="Loading itineraries…" />
      ) : itinerariesStatus === "failed" ? (
        <p className="text-xs text-danger">{itinerariesError}</p>
      ) : (
        <div className="show-scrollbar flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-0.5">
          {sortedItineraries.length === 0 && <p className="py-1 text-xs text-muted-foreground">No itineraries yet.</p>}
          {sortedItineraries.map((itinerary, index) => {
            const isEditing = editingUid === itinerary.uid;
            const isRenaming = renamingUid === itinerary.uid;
            const isDuplicating = duplicatingUid === itinerary.uid;
            const isDeleting = deletingUid === itinerary.uid;
            const isRowBusy = isDuplicating || isDeleting;
            const isSelected = selectedUid === itinerary.uid;
            return (
              <div
                key={itinerary.uid}
                onClick={() => onSelect?.(itinerary.uid)}
                className={cn(
                  "group flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 shadow-sm transition-all duration-150",
                  "hover:-translate-y-px hover:shadow-md",
                  isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/60 bg-card hover:border-primary/40",
                  isEditing && "border-primary/50 ring-1 ring-primary/20",
                )}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[11px] font-semibold text-muted-foreground">
                  {index + 1}
                </span>

                {isEditing ? (
                  <input
                    ref={editInputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={handleEditKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    className="min-w-0 flex-1 rounded border border-primary/40 bg-background px-1.5 py-0.5 text-xs font-medium text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  />
                ) : (
                  <div
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startEditing(itinerary.uid, itinerary.name);
                    }}
                    title="Click to select, double-click to rename"
                    className="flex min-w-0 flex-1 items-center gap-1.5"
                  >
                    <span className="truncate text-xs font-medium text-foreground">{itinerary.name}</span>
                    {itinerary.status && (
                      <Badge tone={STATUS_TONE[itinerary.status] ?? "neutral"} className="shrink-0 text-[10px]">
                        {itinerary.status}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex shrink-0 items-center gap-0.5 opacity-70 transition-opacity group-hover:opacity-100">
                  {!isEditing && (
                    isRenaming ? (
                      <span
                        aria-label="Renaming itinerary"
                        title="Renaming…"
                        className="flex h-7 w-7 items-center justify-center"
                      >
                        <Spinner size="sm" />
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(itinerary.uid, itinerary.name);
                        }}
                        aria-label="Rename itinerary"
                        title="Rename"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        <PiPencilSimpleFill className="h-3.5 w-3.5" />
                      </button>
                    )
                  )}
                  {isDuplicating ? (
                    <span aria-label="Duplicating itinerary" title="Duplicating…" className="flex h-7 w-7 items-center justify-center">
                      <Spinner size="sm" />
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isRowBusy}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(itinerary.uid);
                      }}
                      aria-label="Duplicate itinerary"
                      title="Duplicate"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                    >
                      <PiCopyFill className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {isDeleting ? (
                    <span aria-label="Deleting itinerary" title="Deleting…" className="flex h-7 w-7 items-center justify-center">
                      <Spinner size="sm" />
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isRowBusy}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(itinerary.uid);
                      }}
                      aria-label="Delete itinerary"
                      title="Delete"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                    >
                      <PiTrashFill className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}

        <form
          onSubmit={handleCreate}
          className="mt-1.5 flex shrink-0 items-center gap-2 rounded-lg border border-dashed border-border/70 bg-card px-2.5 py-2 transition-colors duration-150 focus-within:border-primary/50 hover:border-primary/40"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[11px] font-semibold text-muted-foreground/50">
            {sortedItineraries.length + 1}
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New itinerary name (leave blank to auto-name)"
            className="min-w-0 flex-1 bg-transparent text-xs font-medium text-foreground placeholder:text-muted-foreground placeholder:font-normal focus-visible:outline-none"
          />
          <div className="flex shrink-0 items-center">
            {saving ? (
              <span aria-label="Adding itinerary" title="Adding…" className="flex h-7 w-7 items-center justify-center">
                <Spinner size="sm" />
              </span>
            ) : (
              <button
                type="submit"
                disabled={saving}
                aria-label="Add itinerary"
                title="Add itinerary"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
              >
                <PiPlusFill className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </form>
        {formError && <p className="pt-1.5 text-xs text-danger">{formError}</p>}
      </div>
    </>
  );

  return bare ? (
    <div className="flex h-full min-h-0 flex-col gap-2.5">{body}</div>
  ) : (
    <Card variant="elevated" className="flex flex-col gap-2.5 p-3">
      {body}
    </Card>
  );
}
