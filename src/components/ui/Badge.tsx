import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Status pill. Semantic colors (success/warning/danger) are intentionally
// separate from the primary/accent brand hues — status meaning shouldn't
// shift if the brand palette changes.
type Tone = "neutral" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
};

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
