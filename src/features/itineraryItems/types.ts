import type { ItineraryItem, PlanningItemType, TransportDetail, HotelDetail } from "@/lib/itinerary-items";

export type { ItineraryItem, PlanningItemType, TransportDetail, HotelDetail };

export interface CreateItineraryItemPayload {
  itineraryUid: string;
  dayNumber: number;
  itemType: PlanningItemType;
  referenceId?: string;
  title?: string;
  startTime?: string;
  notes?: string;
  longDescription?: string;
  price?: number;
  transportDetail?: TransportDetail;
  hotelDetail?: HotelDetail;
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
  longDescription?: string;
  price?: number;
  transportDetail?: TransportDetail;
  hotelDetail?: HotelDetail;
  /** Item-level Initialize/Booked/Drop status — see lib/itinerary-items' ItineraryItem.status. */
  status?: string;
  droppingReason?: string | null;
  cancellationCharge?: number | null;
}

export interface DeleteItineraryItemPayload {
  uid: string;
  itineraryUid: string;
}

export interface ReorderItineraryItemsPayload {
  itineraryUid: string;
  orderedItemUids: string[];
}
