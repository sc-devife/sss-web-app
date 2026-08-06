import { cn } from "@/lib/cn";
import { Body } from "@/components/ui/Typography";

const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

// "current" inherits the surrounding text color — needed inside solid-fill
// buttons (e.g. primary/danger variants), where the default border-primary
// would blend into a bg-primary background and become invisible.
const toneClasses: Record<"primary" | "current", string> = {
  primary: "border-primary",
  current: "border-current",
};

export function Spinner({
  size = "md",
  tone = "primary",
  className,
}: {
  size?: "sm" | "md" | "lg";
  tone?: "primary" | "current";
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("animate-spin rounded-full border-t-transparent", sizeClasses[size], toneClasses[tone], className)}
    />
  );
}

// Standard "this Redux slice is in its pending state" row — spinner + optional
// label — used everywhere a module's fetch thunk is loading, replacing the
// plain "Loading X…" text used across the app before this component existed.
export function LoadingState({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-2">
      <Spinner size="sm" />
      {label && <Body muted>{label}</Body>}
    </div>
  );
}
