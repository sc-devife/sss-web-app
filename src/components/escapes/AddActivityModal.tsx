"use client";

import { useMemo, useState, type FormEvent } from "react";
import { PiMagnifyingGlassBold, PiMountainsFill, PiPencilSimpleFill, PiCheckBold } from "react-icons/pi";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { TimePicker } from "@/components/ui/TimePicker";
import { Caption } from "@/components/ui/Typography";
import { cn } from "@/lib/cn";
import type { Activity } from "@/lib/activities";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch } from "@/store/hooks";
import { createItineraryItem } from "@/features/itineraryItems/itineraryItemsThunks";

type Source = "library" | "custom";

// The primary "+"-triggered create flow, split into two steps rather than
// one long form: first settle WHAT the activity is (search the library, or
// type a name that has no library match yet), then fill in the WHEN/notes
// once that's locked in. Source (library vs custom) is derived server-side
// from whether a referenceId is sent — this modal doesn't need to send it
// explicitly, just referenceId-or-title like any other create.
export function AddActivityModal({
  open,
  onClose,
  itineraryUid,
  dayNumber,
  activities,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  itineraryUid: string;
  dayNumber: number;
  activities: Activity[];
  onCreated: () => void;
}) {
  const dispatch = useAppDispatch();
  const [step, setStep] = useState<"select" | "details">("select");
  const [source, setSource] = useState<Source>("library");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<{ referenceId: string | null; name: string } | null>(null);
  const [startTime, setStartTime] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const filteredActivities = useMemo(
    () => activities.filter((a) => a.name.toLowerCase().includes(query.trim().toLowerCase())),
    [activities, query],
  );

  function reset() {
    setStep("select");
    setSource("library");
    setQuery("");
    setSelected(null);
    setStartTime("");
    setNotes("");
    setError(undefined);
  }

  function handleClose() {
    if (saving) return;
    reset();
    onClose();
  }

  function pickLibraryActivity(activity: Activity) {
    setSelected({ referenceId: activity.uid, name: activity.name });
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
          itemType: "activity",
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
      setError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save activity"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={step === "select" ? "Add Activity" : "Activity details"}
      className="rounded-2xl border-none shadow-2xl"
    >
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
                  placeholder="Search activities…"
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-[#9da3af] focus-visible:outline-none"
                />
              </div>

              <div className="show-scrollbar flex max-h-72 flex-col gap-1.5 overflow-y-auto">
                {filteredActivities.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    {activities.length === 0 ? "No activities in the library yet." : "No matches."}
                  </p>
                ) : (
                  filteredActivities.map((activity) => (
                    <button
                      key={activity.uid}
                      type="button"
                      onClick={() => pickLibraryActivity(activity)}
                      className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-card px-3 py-2 text-left shadow-sm transition-all hover:-translate-y-px hover:border-primary/40 hover:shadow-md"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
                        <PiMountainsFill className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{activity.name}</span>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <form onSubmit={continueWithCustom} className="flex flex-col gap-3">
              <TextInput
                label="Activity name"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Sunset boat ride"
                autoFocus
                required
              />
              <Button type="submit" disabled={!query.trim()} className="self-end">
                Continue
              </Button>
            </form>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setStep("select")}
            className="flex items-center gap-2.5 self-start rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-left transition-colors hover:border-primary/40"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
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
