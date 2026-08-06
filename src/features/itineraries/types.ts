import type { Itinerary } from "@/lib/itineraries";

export type { Itinerary };

export interface CreateItineraryPayload {
  escapeId: number;
  name: string;
}
