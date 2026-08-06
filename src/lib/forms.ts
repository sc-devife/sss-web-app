// Dirty-check utility shared by every Edit/Update form. A form captures an
// "original" snapshot once, when edit mode is entered, and compares it to
// the live form state so Save/Update can stay disabled until something
// actually changed (and re-disable if the user reverts back to original).
import { useMemo } from "react";

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a as Record<string, unknown>);
    const bKeys = Object.keys(b as Record<string, unknown>);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((k) => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
  }
  return false;
}

// original === null means "not in edit mode / no snapshot captured yet" —
// dirty-check never applies then (Add forms never call this at all).
export function useIsDirty<T>(original: T | null, current: T): boolean {
  return useMemo(() => original !== null && !deepEqual(original, current), [original, current]);
}
