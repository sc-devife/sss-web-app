import type { IconType } from "react-icons";
import { PiCarFill, PiTaxiFill, PiBedFill, PiMountainsFill, PiBinocularsFill, PiForkKnifeFill, PiSunFill, PiDotsThreeCircleFill } from "react-icons/pi";
import type { PlanningItemType } from "@/lib/itinerary-items";

export const PLANNING_ITEM_TYPES: { value: PlanningItemType; label: string }[] = [
  { value: "transport", label: "Transport" },
  { value: "pickup_drop", label: "Pickup / Drop" },
  { value: "hotel", label: "Hotel" },
  { value: "activity", label: "Activity" },
  { value: "sightseeing", label: "Sightseeing" },
  { value: "meal", label: "Meal" },
  { value: "free_time", label: "Free Time" },
  { value: "other", label: "Other" },
];

export const PLANNING_ITEM_ICON: Record<PlanningItemType, IconType> = {
  transport: PiCarFill,
  pickup_drop: PiTaxiFill,
  hotel: PiBedFill,
  activity: PiMountainsFill,
  sightseeing: PiBinocularsFill,
  meal: PiForkKnifeFill,
  free_time: PiSunFill,
  other: PiDotsThreeCircleFill,
};

// Per-type badge color, reusing the app's existing semantic tokens rather
// than introducing new colors — each planning item type gets a distinct,
// consistent tint for its icon badge in the day timeline.
export const PLANNING_ITEM_BADGE_CLASS: Record<PlanningItemType, string> = {
  hotel: "bg-primary/15 text-primary",
  activity: "bg-success/15 text-success",
  sightseeing: "bg-success/15 text-success",
  transport: "bg-warning/15 text-warning",
  pickup_drop: "bg-accent/15 text-accent",
  meal: "bg-danger/15 text-danger",
  free_time: "bg-muted text-muted-foreground",
  other: "bg-muted text-muted-foreground",
};

// Which library array (if any) backs each type — drives the conditional
// "pick from library" select in the add/edit planning-item form.
export type LibraryRefKind = "hotel" | "activity" | "transport" | "serviceProvider" | "none";

export const PLANNING_ITEM_REF_KIND: Record<PlanningItemType, LibraryRefKind> = {
  transport: "transport",
  pickup_drop: "transport",
  hotel: "hotel",
  activity: "activity",
  sightseeing: "activity",
  meal: "serviceProvider",
  other: "serviceProvider",
  free_time: "none",
};

// escape.startDate ("YYYY-MM-DD") + (dayNumber-1) days -> a real Date, so a
// day-card can show "20 AUG 2026" instead of just "Day 1". Plain Date math —
// no date library is installed in this project.
export function dayNumberToDate(startDate: string | null, dayNumber: number): Date | null {
  if (!startDate) return null;
  const date = new Date(startDate + "T00:00:00");
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + (dayNumber - 1));
  return date;
}

export function formatDayDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase().replace(/,/g, "");
}

// "THU, 20 AUG 2026" — same date format prefixed with the short weekday, for
// spots (like the day tab strip) where the day-of-week matters at a glance.
export function formatDayDateWithWeekday(date: Date | null): string {
  if (!date) return "";
  const weekday = date.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase();
  return `${weekday}, ${formatDayDate(date)}`;
}

// "HH:mm:ss" (backend LocalTime JSON) -> "HH:mm" for display.
export function formatStartTime(startTime: string | null): string | null {
  return startTime ? startTime.slice(0, 5) : null;
}
