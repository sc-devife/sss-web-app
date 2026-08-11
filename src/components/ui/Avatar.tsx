import { cn } from "@/lib/cn";

// Initial-letter circle for a person's name — no photo upload exists for
// travellers/leads, so this is always the letter form, not an img fallback.
export function Avatar({ name, className }: { name: string; className?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary",
        className,
      )}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
