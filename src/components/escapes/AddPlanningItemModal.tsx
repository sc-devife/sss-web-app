"use client";

import { useMemo, useState, type FormEvent } from "react";
import { PiMagnifyingGlassBold, PiPencilSimpleFill, PiCheckBold } from "react-icons/pi";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { TimePicker } from "@/components/ui/TimePicker";
import { Caption } from "@/components/ui/Typography";
import { cn } from "@/lib/cn";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch } from "@/store/hooks";
import { createItineraryItem } from "@/features/itineraryItems/itineraryItemsThunks";
import type { PlanningItemType } from "@/lib/itinerary-items";
import { PLANNING_ITEM_ICON, PLANNING_ITEM_BADGE_CLASS } from "@/lib/itinerary-planning";

type Source = "library" | "custom";

export interface PlanningLibraryOption {
  uid: string;
  label: string;
  // Only populated for hotel options — lets the picker offer a follow-up
  // "which room type" step without needing a second reference field on the
  // itinerary item itself (the room type name just gets folded into notes).
  roomTypes?: { uid: string; name: string }[];
}

// Generalized version of the day planner's "+"-triggered create flow, driven
// by itemType so the same two-step (what → when/notes) UX serves Transport,
// Hotel, Meal, and Activity instead of duplicating it per type.
export function AddPlanningItemModal({
  open,
  onClose,
  itineraryUid,
  dayNumber,
  itemType,
  title,
  libraryOptions,
  libraryEmptyLabel,
  searchPlaceholder,
  nameFieldLabel,
  namePlaceholder,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  itineraryUid: string;
  dayNumber: number;
  itemType: PlanningItemType;
  title: string;
  libraryOptions: PlanningLibraryOption[];
  libraryEmptyLabel: string;
  searchPlaceholder: string;
  nameFieldLabel: string;
  namePlaceholder: string;
  onCreated: () => void;
}) {
  const dispatch = useAppDispatch();
  const [step, setStep] = useState<"select" | "roomType" | "details">("select");
  const [source, setSource] = useState<Source>("library");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<{ referenceId: string | null; name: string } | null>(null);
  const [pendingHotel, setPendingHotel] = useState<PlanningLibraryOption | null>(null);
  const [startTime, setStartTime] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const Icon = PLANNING_ITEM_ICON[itemType];
  const badgeClass = PLANNING_ITEM_BADGE_CLASS[itemType];

  const filteredOptions = useMemo(
    () => libraryOptions.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase())),
    [libraryOptions, query],
  );

  function reset() {
    setStep("select");
    setSource("library");
    setQuery("");
    setSelected(null);
    setPendingHotel(null);
    setStartTime("");
    setNotes("");
    setError(undefined);
  }

  function handleClose() {
    if (saving) return;
    reset();
    onClose();
  }

  function pickLibraryOption(option: PlanningLibraryOption) {
    if (option.roomTypes && option.roomTypes.length > 0) {
      setPendingHotel(option);
      setStep("roomType");
      return;
    }
    setSelected({ referenceId: option.uid, name: option.label });
    setStep("details");
  }

  function pickRoomType(roomTypeName: string | null) {
    if (!pendingHotel) return;
    setSelected({ referenceId: pendingHotel.uid, name: pendingHotel.label });
    if (roomTypeName) {
      setNotes((n) => (n ? n : `Room type: ${roomTypeName}`));
    }
    setPendingHotel(null);
    setStep("details");
  }

  function continueWithCustom(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSelected({ referenceId: null, name: query.trim() });
    setStep("details");
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setError(undefined);
    try {
      await dispatch(
        createItineraryItem({
          itineraryUid,
          dayNumber,
          itemType,
          referenceId: selected.referenceId ?? undefined,
          title: selected.referenceId ? undefined : selected.name,
          startTime: startTime || undefined,
          notes: notes.trim() || undefined,
        }),
      ).unwrap();
      onCreated();
      reset();
      onClose();
    } catch (err) {
      setError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save item"));
    } finally {
      setSaving(false);
    }
  }

  const modalTitle = step === "select" ? title : step === "roomType" ? "Select room type" : `${title} details`;

  return (
    <Modal open={open} onClose={handleClose} title={modalTitle} className="rounded-2xl border-none shadow-2xl">
      {step === "select" ? (
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-0.5 self-start rounded-full bg-muted p-1">
            {(["library", "custom"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSource(s);
                  setQuery("");
                }}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors",
                  source === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s === "library" ? "From library" : "Custom"}
              </button>
            ))}
          </div>

          {source === "library" ? (
            <>
              <div className="flex items-center gap-2 rounded-full border border-transparent bg-[#f8f8fa] px-3 h-9 transition-colors focus-within:border-primary/40 focus-within:bg-background">
                <PiMagnifyingGlassBold className="h-3.5 w-3.5 shrink-0 text-[#9da3af]" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-[#9da3af] focus-visible:outline-none"
                />
              </div>

              <div className="show-scrollbar flex max-h-72 flex-col gap-1.5 overflow-y-auto">
                {filteredOptions.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    {libraryOptions.length === 0 ? libraryEmptyLabel : "No matches."}
                  </p>
                ) : (
                  filteredOptions.map((option) => (
                    <button
                      key={option.uid}
                      type="button"
                      onClick={() => pickLibraryOption(option)}
                      className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-card px-3 py-2 text-left shadow-sm transition-all hover:-translate-y-px hover:border-primary/40 hover:shadow-md"
                    >
                      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", badgeClass)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{option.label}</span>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <form onSubmit={continueWithCustom} className="flex flex-col gap-3">
              <TextInput
                label={nameFieldLabel}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={namePlaceholder}
                autoFocus
                required
              />
              <Button type="submit" disabled={!query.trim()} className="self-end">
                Continue
              </Button>
            </form>
          )}
        </div>
      ) : step === "roomType" ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {pendingHotel?.label} has room types on file — pick one for this stay, or skip.
          </p>
          <div className="show-scrollbar flex max-h-72 flex-col gap-1.5 overflow-y-auto">
            {pendingHotel?.roomTypes?.map((rt) => (
              <button
                key={rt.uid}
                type="button"
                onClick={() => pickRoomType(rt.name)}
                className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-card px-3 py-2 text-left shadow-sm transition-all hover:-translate-y-px hover:border-primary/40 hover:shadow-md"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{rt.name}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-between gap-2 border-t border-border pt-3">
            <Button type="button" variant="ghost" onClick={() => setStep("select")}>
              Back
            </Button>
            <Button type="button" variant="secondary" onClick={() => pickRoomType(null)}>
              Skip
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setStep("select")}
            className="flex items-center gap-2.5 self-start rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-left transition-colors hover:border-primary/40"
          >
            <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", badgeClass)}>
              {selected?.referenceId ? <PiCheckBold className="h-4 w-4" /> : <PiPencilSimpleFill className="h-4 w-4" />}
            </span>
            <span className="min-w-0 flex-1">
              <Caption className="block">{selected?.referenceId ? "From library" : "Custom"}</Caption>
              <span className="truncate text-sm font-semibold text-foreground">{selected?.name}</span>
            </span>
            <span className="shrink-0 text-xs font-medium text-primary">Change</span>
          </button>

          <TimePicker label="Start time" value={startTime} onChange={setStartTime} />
          <TextInput
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Bengaluru → Netravati"
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="ghost" disabled={saving} onClick={() => setStep("select")}>
              Back
            </Button>
            <Button type="button" disabled={saving} loading={saving} loadingText="Saving…" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
