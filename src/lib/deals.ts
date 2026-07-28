import { backendJson } from "@/lib/backend";

export interface Deal {
  uid: string;
  tripId: number;
  acceptedQuoteUid: string;
  status: string;
  createdAt: string;
}

export async function getDealForTrip(tripId: number): Promise<Deal | null> {
  try {
    return await backendJson<Deal>(`/api/deals?tripId=${tripId}`);
  } catch {
    return null;
  }
}

export async function getDealByUid(uid: string): Promise<Deal> {
  return backendJson<Deal>(`/api/deals/${uid}`);
}
