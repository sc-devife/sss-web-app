import type { Itinerary } from "@/lib/itineraries";

export type { Itinerary };

export interface CreateItineraryPayload {
  tripId: number;
  name: string;
}
