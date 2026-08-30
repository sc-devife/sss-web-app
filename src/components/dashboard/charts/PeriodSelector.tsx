import { cn } from "@/lib/cn";
import type { LeadsTrendPeriod } from "@/features/dashboard/types";

const OPTIONS: { value: LeadsTrendPeriod; label: string }[] = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "12m", label: "12 Months" },
];

// A small controlled segmented control — distinct from the shared `Tabs`
// component, which manages its own active-tab state internally and isn't
// suited to a value that lives in Redux and drives a data refetch.
export function PeriodSelector({ value, onChange }: { value: LeadsTrendPeriod; onChange: (period: LeadsTrendPeriod) => void }) {
  return (
    <div className="flex shrink-0 gap-1 rounded-full border border-border bg-muted/30 p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
            value === opt.value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
