import type { Itinerary } from "@/lib/itineraries";

export type { Itinerary };

export interface CreateItineraryPayload {
  escapeUid: string;
  name: string;
}

export interface UpdateItineraryPayload {
  uid: string;
  name: string;
}
