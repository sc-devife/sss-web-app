import type { IconType } from "react-icons";
import { PiCarFill, PiTaxiFill, PiBedFill, PiMountainsFill, PiBinocularsFill, PiForkKnifeFill, PiSunFill, PiDotsThreeCircleFill } from "react-icons/pi";
import type { ItineraryItem, PlanningItemType } from "@/lib/itinerary-items";

// "hotel" is deliberately excluded here — this list only drives the Add
// Activity form's Type select, and hotels aren't added through it. The
// value still exists in PlanningItemType/PLANNING_ITEM_ICON/etc. below so
// existing hotel-type items (created before this change) keep rendering
// correctly in the day timeline.
export const PLANNING_ITEM_TYPES: { value: PlanningItemType; label: string }[] = [
  { value: "transport", label: "Transport" },
  { value: "pickup_drop", label: "Pickup / Drop" },
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

// The one customer-facing "total price" for an item, regardless of which
// itemType-specific shape it actually lives in — Hotel's own totalPrice
// field, Activity's base price, or (for Transport) the simple mode price /
// flight's selling price (times pax, if it's marked per-person). Used by
// both the per-item price badge and the day-total sum, so both always agree
// on what "this item's price" means.
export function getItemTotalPrice(item: ItineraryItem): number | null {
  if (item.itemType === "hotel") {
    return item.hotelDetail?.totalPrice ?? null;
  }
  if (item.itemType === "activity" || item.itemType === "sightseeing") {
    return item.price;
  }
  if (item.itemType === "transport" || item.itemType === "pickup_drop") {
    const detail = item.transportDetail;
    if (!detail) return null;
    if (detail.modeCode === "flight") {
      if (detail.sellingPrice == null) return null;
      const pax = (detail.adultsCount ?? 0) + (detail.childrenCount ?? 0) + (detail.infantsCount ?? 0);
      return detail.sellingPricePerPerson ? detail.sellingPrice * Math.max(pax, 1) : detail.sellingPrice;
    }
    return detail.price;
  }
  return null;
}
