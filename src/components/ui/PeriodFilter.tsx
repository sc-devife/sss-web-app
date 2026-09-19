"use client";

import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { ToolbarSelect } from "@/components/ui/ToolbarSelect";
import type { LeadPeriodType } from "@/lib/lead-period";

const PERIOD_TYPE_OPTIONS: { value: LeadPeriodType; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
  { value: "all", label: "All" },
];

// Small icon-only prev/next control matching ToolbarSelect's own compact
// pill styling (that trigger hand-rolls its button rather than using the
// shared Button component, so this does too, for the same "sits directly
// beside a ToolbarSelect" visual context — Button's smallest size is h-8,
// 4px taller, which would misalign the row).
function PeriodStepButton({
  direction,
  label,
  onClick,
  disabled,
}: {
  direction: "prev" | "next";
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-transparent bg-[#f8f8fa] text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground focus-visible:border-primary/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
    >
      {direction === "prev" ? <IoChevronBack size={14} /> : <IoChevronForward size={14} />}
    </button>
  );
}

// Month/Week/Day/All selector with prev/next stepping and the current
// period's label beside it — shared by the Leads and Transactions toolbars.
// Purely presentational; the owner holds the type/anchor state (see
// lib/lead-period.ts for the range math).
export function PeriodFilter({
  type,
  label,
  onTypeChange,
  onStep,
}: {
  type: LeadPeriodType;
  /** Current period's display label; empty for "all". */
  label: string;
  onTypeChange: (value: LeadPeriodType) => void;
  onStep: (direction: 1 | -1) => void;
}) {
  return (
    <>
      <div className="flex items-center gap-1">
        <PeriodStepButton direction="prev" label={`Previous ${type}`} onClick={() => onStep(-1)} disabled={type === "all"} />
        <ToolbarSelect
          label="Period"
          hideLabel
          options={PERIOD_TYPE_OPTIONS}
          value={type}
          onChange={(v) => onTypeChange(v as LeadPeriodType)}
        />
        <PeriodStepButton direction="next" label={`Next ${type}`} onClick={() => onStep(1)} disabled={type === "all"} />
      </div>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </>
  );
}
