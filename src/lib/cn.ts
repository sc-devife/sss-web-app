import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Plain clsx concatenation leaves conflicting same-property utility classes
// (e.g. a component's default `max-w-lg` and a caller's override `max-w-3xl`)
// sitting side by side in the className string — which one wins then depends
// on Tailwind's generated CSS rule order, not on argument order, and that
// generation order isn't guaranteed stable across builds/dev-server restarts.
// twMerge resolves same-property conflicts deterministically by keeping the
// last class for each property, so a later argument reliably overrides an
// earlier one exactly as the call site's argument order implies.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}
