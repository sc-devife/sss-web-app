import { backendJson } from "@/lib/backend";

export interface Trip {
  seqp: number;
  lead: { seqp: number; name: string } | null;
  travellers: { seqp: number; firstName: string; lastName: string | null }[];
  destinations: { uid: string; name: string }[];
  startDate: string | null;
  numberOfDays: number | null;
  endDate: string | null;
  status: string;
}

export async function getTrips(): Promise<Trip[]> {
  return backendJson<Trip[]>("/escape");
}

export async function getTripById(id: number): Promise<Trip> {
  return backendJson<Trip>(`/escape/${id}`);
}
