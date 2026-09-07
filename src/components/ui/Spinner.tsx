import { cn } from "@/lib/cn";
import { Body } from "@/components/ui/Typography";

const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

// "current" inherits the surrounding text color — needed inside solid-fill
// buttons (e.g. primary/danger variants), where the default border-primary
// would blend into a bg-primary background and become invisible. "danger"
// is for a pending state on a destructive action (e.g. a Remove button)
// where the spinner itself should read as danger-toned, not just inherit.
//
// Colors only the right/bottom/left sides (never the bare `border-{color}`
// shorthand) so this composes correctly with the base `border-t-transparent`
// below under tailwind-merge: twMerge's border-color classGroup treats the
// all-sides shorthand as conflicting with — and dropping — any single-side
// class (see tailwind-merge's `conflictingClassGroups['border-color']`), so
// pairing it with `border-t-transparent` silently deleted the transparent
// top and left the ring a single solid color, motion-invisible even though
// `animate-spin` kept running. The four directional side classes don't
// conflict with one another, so all four survive the merge intact.
const toneClasses: Record<"primary" | "current" | "danger", string> = {
  primary: "border-r-primary border-b-primary border-l-primary",
  current: "border-r-current border-b-current border-l-current",
  danger: "border-r-danger border-b-danger border-l-danger",
};

export function Spinner({
  size = "md",
  tone = "primary",
  className,
}: {
  size?: "sm" | "md" | "lg";
  tone?: "primary" | "current" | "danger";
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
