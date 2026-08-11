import type { ItineraryItem, PlanningItemType } from "@/lib/itinerary-items";

export type { ItineraryItem, PlanningItemType };

export interface CreateItineraryItemPayload {
  itineraryUid: string;
  dayNumber: number;
  itemType: PlanningItemType;
  referenceId?: string;
  title?: string;
  startTime?: string;
  notes?: string;
}

export interface UpdateItineraryItemPayload {
  uid: string;
  itineraryUid: string; // not sent to the backend — kept for slice bookkeeping
  dayNumber?: number;
  itemType?: PlanningItemType;
  referenceId?: string;
  title?: string;
  startTime?: string;
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
