import { cn } from "@/lib/cn";

// First letter of the first name + first letter of the last name ("Admin User"
// → "AU"); a single-word name gives one letter.
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
}

// Initials circle for a person's name — no photo upload exists for
// travellers/leads, so this is always the letter form, not an img fallback.
export function Avatar({ name, className }: { name: string; className?: string }) {
  const initial = initialsOf(name);
  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold uppercase text-primary",
        className,
      )}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
