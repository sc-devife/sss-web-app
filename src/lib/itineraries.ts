import { backendJson } from "@/lib/backend";

export interface Itinerary {
  uid: string;
  tripId: number;
  name: string;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export async function getItinerariesForTrip(tripId: number): Promise<Itinerary[]> {
  return backendJson<Itinerary[]>(`/api/itineraries?tripId=${tripId}`);
}
