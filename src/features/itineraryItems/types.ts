import type { ItineraryItem } from "@/lib/itinerary-items";

export type { ItineraryItem };

export interface CreateItineraryItemPayload {
  itineraryUid: string;
  dayNumber: number;
  itemType: "hotel" | "activity" | "transport";
  referenceId: string;
  notes?: string;
}

export interface DeleteItineraryItemPayload {
  uid: string;
  itineraryUid: string;
}

export interface ReorderItineraryItemsPayload {
  itineraryUid: string;
  orderedItemUids: string[];
}
