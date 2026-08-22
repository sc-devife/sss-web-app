// Shared formatting for audit-log entries — used everywhere an audit trail
// is rendered (Lead Detail Modal, Escape Summary Card, Escape History tab)
// so "who did what" reads the same way in every one of those places.

// previousValue/newValue are stored as the raw output of Jackson's
// writeValueAsString(Object) — a plain string like "Qualified" is serialized
// as the JSON string `"Qualified"` (quotes included), so a bare string value
// arrives here still wrapped in literal quote characters. Strip those for
// display; leave anything else (numbers, objects) as-is.
function unwrapJsonString(value: string): string {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

export function formatAuditActor(performedByName: string | null | undefined): string {
  return performedByName ? performedByName : "System";
}

// Renders "Qualified -> Converted" when both sides are present, or just the
// new value alone (e.g. an assignment reason) when there's nothing to diff.
export function formatAuditChange(
  previousValue: string | null | undefined,
  newValue: string | null | undefined,
): string | null {
  const prev = previousValue ? unwrapJsonString(previousValue) : null;
  const next = newValue ? unwrapJsonString(newValue) : null;

  if (prev && next) return `${prev} → ${next}`;
  if (next) return next;
  if (prev) return prev;
  return null;
}
