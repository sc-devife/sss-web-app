import { cn } from "@/lib/cn";

// Shared shimmer block for loading states — a plain div sized/shaped per call
// site (h-4 w-32, rounded-full for avatars, etc.) so skeletons can mirror the
// real content's layout exactly. See the `.skeleton` class in globals.css for
// the animation itself.
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("skeleton rounded", className)} />;
}
