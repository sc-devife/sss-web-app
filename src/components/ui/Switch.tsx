"use client";

import { cn } from "@/lib/cn";

// A checkbox styled as an ON/OFF pill switch, with the current state spelled
// out inside the track (not just knob position) — for a setting whose
// on/off meaning isn't obvious from context alone (e.g. "accepting leads").
// For a switch where the knob position is enough on its own, see
// AutoAssignTogglePanel's own inline (textless) variant instead of this one.
export function Switch({
  checked,
  onChange,
  disabled,
  onLabel = "ON",
  offLabel = "OFF",
  ariaLabel,
  title,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  onLabel?: string;
  offLabel?: string;
  ariaLabel?: string;
  title?: string;
}) {
  return (
    <label
      className={cn(
        "relative inline-flex h-6 w-14 shrink-0 items-center rounded-full px-2 transition-colors",
        checked ? "justify-start bg-primary" : "justify-end bg-muted",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      )}
      title={title}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel ?? title}
        title={title}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={cn(
          "text-[10px] font-bold tracking-wide",
          checked ? "ml-1.5 text-primary-foreground" : "mr-1.5 text-muted-foreground",
        )}
      >
        {checked ? onLabel : offLabel}
      </span>
      <span
        className={cn(
          "absolute left-0.5 h-4 w-4 rounded-full bg-card shadow-sm transition-transform",
          checked ? "translate-x-[34px]" : "translate-x-0",
        )}
      />
    </label>
  );
}
