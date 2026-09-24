import type { Itinerary } from "@/lib/itineraries";

export type { Itinerary };

export interface CreateItineraryPayload {
  escapeUid: string;
  name: string;
  /** What to do with the escape's earlier open itineraries (and their quotes). */
  previousStatus?: "rejected" | "superseded";
}

export interface UpdateItineraryPayload {
  uid: string;
  name: string;
}
