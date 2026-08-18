// Single shared date-display utility — every user-facing date in the app
// should go through this rather than ad-hoc `toLocaleDateString()`/manual
// formatting, so the display format stays consistent and changes in one
// place. Format: DD-MM-YYYY (e.g. "20-08-2026").
//
// Reads the YYYY-MM-DD prefix directly out of the string via regex instead
// of `new Date(value).getDate()` — a plain date-only string like
// "2026-08-20" is parsed as UTC midnight per spec, and `.getDate()` reads it
// back in the *local* timezone, which silently shifts the day by one in any
// timezone behind UTC. Reading the digits straight out of the string sidesteps
// that entirely and works the same for both bare dates and full ISO timestamps.
export function formatDisplayDate(value: string | null | undefined): string | null {
  if (!value) return value ?? null;

  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}-${month}-${year}`;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return trimmed;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Date + time-of-day, for real timestamps (createdAt, lastSyncedAt, etc.) —
// the date portion uses the same DD-MM-YYYY formatting as formatDisplayDate,
// the time portion reflects the viewer's local time (appropriate here since
// a timestamp is a real moment, unlike a bare calendar date).
export function formatDisplayDateTime(value: string | null | undefined): string | null {
  if (!value) return value ?? null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const datePart = formatDisplayDate(value);
  const timePart = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${datePart}, ${timePart}`;
}
