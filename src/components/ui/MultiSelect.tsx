import { useId } from "react";
import { cn } from "@/lib/cn";
import type { SelectOption } from "@/components/ui/Select";

interface MultiSelectProps {
  label: string;
  options: SelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  error?: string;
  className?: string;
}

// A checkbox list rather than a native <select multiple> — much easier to
// scan and touch-target on mobile, and it's the same interaction pattern
// Section 12 asks for on small screens anyway.
export function MultiSelect({ label, options, value, onChange, error, className }: MultiSelectProps) {
  const groupId = useId();

  function toggle(optValue: string) {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div
        role="group"
        aria-labelledby={groupId}
        className={cn(
          "flex flex-wrap gap-2 rounded border border-border bg-background p-2",
          error && "border-danger",
        )}
      >
        {options.map((opt) => {
          const checked = value.includes(opt.value);
          return (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded border px-2.5 py-1 text-sm transition-colors",
                checked
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(opt.value)}
                className="h-3.5 w-3.5 accent-primary"
              />
              {opt.label}
            </label>
          );
        })}
        {options.length === 0 && <span className="text-sm text-muted-foreground">No options available</span>}
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
