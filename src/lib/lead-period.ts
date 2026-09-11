// Month/Week/Day date-navigation for the Leads page (LeadsPanel's period
// filter, right after the Status filter). All boundary math goes through
// plain local-calendar Date arithmetic (setDate/setMonth), never manual
// day-counting, so month lengths, leap years, and year rollovers are handled
// by the same engine the rest of the app already trusts (DatePicker's own
// month-grid builder works the same way).

import { dateToIsoDate } from "@/lib/date";

export type LeadPeriodType = "month" | "week" | "day" | "all";

export interface LeadPeriodRange {
  /** Inclusive, "YYYY-MM-DD" — sent to the API as-is. Null for "all" (no date filter — fetch everything). */
  from: string | null;
  /** Inclusive, "YYYY-MM-DD" — the API treats this as a whole day. Null for "all". */
  to: string | null;
  /** e.g. "September 2026" / "7 Sep – 13 Sep 2026" / "8 Sep 2026" / "" for "all". */
  label: string;
}

// Monday-start week (ISO 8601) — the only convention this app's requirements
// ever pin down (the worked example "7 Sep – 13 Sep 2026" is a Mon-Sun week).
// date.getDay(): 0=Sun..6=Sat.
function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = start.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMonday);
  return start;
}

const MONTH_LABEL = (date: Date) => date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

// Built from a fixed abbreviation list rather than
// toLocaleDateString(..., { month: "short" }) — en-GB's ICU data renders
// September as "Sept" (4 letters, unlike every other month's 3), which
// doesn't match this feature's own spec'd example ("7 Sep – 13 Sep 2026").
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SHORT_LABEL = (date: Date, withYear: boolean) =>
  `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}${withYear ? ` ${date.getFullYear()}` : ""}`;

export function getLeadPeriodRange(type: LeadPeriodType, anchor: Date): LeadPeriodRange {
  if (type === "all") {
    return { from: null, to: null, label: "" };
  }

  if (type === "month") {
    const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    // Day 0 of "next month" is the last calendar day of this one — correct
    // for every month length and leap-year February with no special-casing.
    const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    return { from: dateToIsoDate(start), to: dateToIsoDate(end), label: MONTH_LABEL(start) };
  }

  if (type === "week") {
    const start = startOfWeek(anchor);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    const crossesYear = start.getFullYear() !== end.getFullYear();
    return {
      from: dateToIsoDate(start),
      to: dateToIsoDate(end),
      label: `${SHORT_LABEL(start, crossesYear)} – ${SHORT_LABEL(end, true)}`,
    };
  }

  // day
  const iso = dateToIsoDate(anchor);
  return { from: iso, to: iso, label: SHORT_LABEL(anchor, true) };
}

// Returns a new anchor shifted by exactly one period in `direction`. Uses
// day=1 for month shifts specifically so a month with fewer days than the
// anchor's current day-of-month (e.g. anchored on the 31st) can't overflow
// into the month after — setMonth's own overflow behavior is the classic
// trap here (Jan 31 + 1 month naively lands on Mar 3, not Feb 28/29).
export function shiftLeadPeriodAnchor(type: LeadPeriodType, anchor: Date, direction: 1 | -1): Date {
  if (type === "month") {
    return new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1);
  }
  if (type === "week") {
    return new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + direction * 7);
  }
  if (type === "day") {
    return new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + direction);
  }
  // "all" has no period to step through — the prev/next buttons are disabled
  // for it in the UI, so this is unreachable in practice.
  return anchor;
}
