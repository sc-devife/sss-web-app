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
  travelersCount?: number;
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
  travelersCount?: number;
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

// Change/Replace Hotel flow — drops `uid` (the existing hotel item) and
// creates `newHotel` as its replacement in one backend call. See
// ItineraryItemHelper.replaceHotel.
export interface ReplaceHotelPayload {
  uid: string;
  itineraryUid: string;
  droppingReason: string;
  cancellationCharge?: number;
  newHotel: {
    dayNumber: number;
    referenceId?: string;
    title?: string;
    hotelDetail?: HotelDetail;
  };
}

export interface ReorderItineraryItemsPayload {
  itineraryUid: string;
  orderedItemUids: string[];
}

// Moves an entire day's items to a different day position — see
// ItineraryItemHelper.reorderDays. The date shown for each position never
// moves (it's always derived from escape.startDate + dayNumber); only which
// items occupy fromDayNumber/toDayNumber and everything strictly between
// them shifts.
export interface ReorderItineraryDaysPayload {
  itineraryUid: string;
  fromDayNumber: number;
  toDayNumber: number;
}
