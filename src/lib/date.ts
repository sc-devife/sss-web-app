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

// "HH:mm" (24-hour, the shape TimePicker/native `type="time"` both use) ->
// "h:mm AM/PM" for display.
export function formatDisplayTime(value: string | null | undefined): string | null {
  if (!value) return value ?? null;
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return value;
  const h24 = Number(match[1]);
  const m = Number(match[2]);
  if (Number.isNaN(h24) || Number.isNaN(m)) return value;
  const period = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

// "HH:mm" + a duration in minutes -> "HH:mm" (24-hour, same shape), wrapping
// past midnight — used to derive a service's end time from its start time.
export function addMinutesToTime(value: string, minutes: number): string | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return null;
  const h24 = Number(match[1]);
  const m = Number(match[2]);
  if (Number.isNaN(h24) || Number.isNaN(m) || Number.isNaN(minutes)) return null;
  const total = ((h24 * 60 + m + minutes) % 1440 + 1440) % 1440;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

// "2h ago" / "Just now" style — for presence-style timestamps (last active,
// last synced) where a relative sense of recency matters more than the exact
// moment. Falls back to the absolute date once it's more than a week old,
// since "23 days ago" is less useful than the actual date at that point.
export function formatRelativeTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 0) return "Just now";
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDisplayDateTime(value);
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
