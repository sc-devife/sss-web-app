"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Body } from "@/components/ui/Typography";
import { cn } from "@/lib/cn";

export type PreviousStatus = "rejected" | "superseded" | null;
type Choice = Exclude<PreviousStatus, null>;

const OPTIONS: { value: Choice; label: string; hint: string }[] = [
  { value: "rejected", label: "Rejected", hint: "The customer didn't go with it" },
  { value: "superseded", label: "Superseded", hint: "Replaced by the new one" },
];

// Asked before a new itinerary/quote is created while earlier ones are still
// open: what should happen to those. Confirming creates the new one and
// applies the chosen status. Choosing one is mandatory — Create stays disabled until then (accepted ones are never touched server-side).
export function PreviousStatusModal({
  open,
  kind,
  count,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  kind: "itinerary" | "quote";
  count: number;
  busy?: boolean;
  onConfirm: (status: Choice) => void;
  onCancel: () => void;
}) {
  const [choice, setChoice] = useState<Choice | null>(null);
  // Always start with nothing selected, however the dialog was last closed.
  useEffect(() => {
    if (open) setChoice(null);
  }, [open]);

  const plural = kind === "itinerary" ? "itineraries" : "quotes";
  const noun = count === 1 ? kind : plural;

  return (
    <Modal open={open} onClose={busy ? () => {} : () => { setChoice(null); onCancel(); }} title={`Create new ${kind}`}>
      <div className="flex flex-col items-center gap-4 text-center">
        <Body>
          This {kind === "itinerary" ? "escape" : "itinerary"} has {count} earlier {noun} still open
          {kind === "itinerary" ? ", along with their open quotes" : ""}. Choose a status for {count === 1 ? "it" : "them"} to continue:
        </Body>
        <div className="flex w-full flex-col gap-2">
          {OPTIONS.map((o) => (
            <button
              key={String(o.value)}
              type="button"
              onClick={() => setChoice(o.value)}
              aria-pressed={choice === o.value}
              className={cn(
                "flex flex-col items-center rounded-lg border px-3 py-2 transition-colors",
                choice === o.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
              )}
            >
              <span className="text-sm font-medium text-foreground">{o.label}</span>
              <span className="text-xs text-muted-foreground">{o.hint}</span>
            </button>
          ))}
        </div>
        <div className="flex justify-center gap-2">
          <Button variant="ghost" disabled={busy} onClick={() => { setChoice(null); onCancel(); }}>Cancel</Button>
          <Button disabled={busy || choice === null} loading={busy} loadingText="Creating…" onClick={() => choice && onConfirm(choice)}>Create</Button>
        </div>
      </div>
    </Modal>
  );
}
