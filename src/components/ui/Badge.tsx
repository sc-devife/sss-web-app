import type { IconType } from "react-icons";
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

export function Badge({
  children,
  tone = "neutral",
  icon: Icon,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  icon?: IconType;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}
