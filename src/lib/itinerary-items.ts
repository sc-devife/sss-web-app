import { backendJson } from "@/lib/backend";

export type PlanningItemType =
  | "transport"
  | "pickup_drop"
  | "hotel"
  | "activity"
  | "sightseeing"
  | "meal"
  | "free_time"
  | "other";

export interface ItineraryItem {
  uid: string;
  itineraryUid: string;
  dayNumber: number;
  itemType: PlanningItemType;
  referenceId: string | null;
  referenceLabel: string;
  source: "library" | "custom";
  title: string | null;
  startTime: string | null;
  notes: string | null;
  sortOrder: number;
}

export async function getItemsForItinerary(itineraryUid: string): Promise<ItineraryItem[]> {
  return backendJson<ItineraryItem[]>(`/api/itinerary-items?itineraryUid=${itineraryUid}`);
}
