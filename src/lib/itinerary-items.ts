import { backendJson } from "@/lib/backend";

export interface ItineraryItem {
  uid: string;
  itineraryUid: string;
  dayNumber: number;
  itemType: "hotel" | "activity" | "transport";
  referenceId: string;
  referenceLabel: string;
  notes: string | null;
  sortOrder: number;
}

export async function getItemsForItinerary(itineraryUid: string): Promise<ItineraryItem[]> {
  return backendJson<ItineraryItem[]>(`/api/itinerary-items?itineraryUid=${itineraryUid}`);
}
