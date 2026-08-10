import type { Itinerary } from "@/lib/itineraries";

export type { Itinerary };

export interface CreateItineraryPayload {
  escapeUid: string;
  name: string;
}
