import { backendJson } from "@/lib/backend";

export interface Itinerary {
  uid: string;
  escapeId: number;
  name: string;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export async function getItinerariesForEscape(escapeId: number): Promise<Itinerary[]> {
  return backendJson<Itinerary[]>(`/api/itineraries?escapeId=${escapeId}`);
}

export async function getItineraryByUid(uid: string): Promise<Itinerary> {
  return backendJson<Itinerary>(`/api/itineraries/${uid}`);
}
