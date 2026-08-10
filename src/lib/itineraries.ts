import { backendJson } from "@/lib/backend";

export interface Itinerary {
  uid: string;
  escapeUid: string;
  name: string;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export async function getItinerariesForEscape(escapeUid: string): Promise<Itinerary[]> {
  return backendJson<Itinerary[]>(`/api/itineraries?escapeUid=${escapeUid}`);
}

export async function getItineraryByUid(uid: string): Promise<Itinerary> {
  return backendJson<Itinerary>(`/api/itineraries/${uid}`);
}
