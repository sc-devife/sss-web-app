import type { SelectOption } from "@/components/ui/Select";

// Options for a "max concurrent" cap dropdown. "" is the no-cap entry (saved
// as null). A cap already stored with a value outside `presets` (set back when
// this was a free-text number field) is added as its own option, so the field
// never shows blank or silently rewrites it.
export function maxConcurrentOptions(current: string, presets: number[], noLimitLabel: string): SelectOption[] {
  const values = [...presets];
  const n = Number(current);
  if (current !== "" && Number.isFinite(n) && !values.includes(n)) {
    values.push(n);
    values.sort((a, b) => a - b);
  }
  return [{ value: "", label: noLimitLabel }, ...values.map((v) => ({ value: String(v), label: String(v) }))];
}
