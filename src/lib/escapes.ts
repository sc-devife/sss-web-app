import { backendJson } from "@/lib/backend";

export interface Escape {
  seqp: number;
  lead: { seqp: number; name: string } | null;
  travellers: { seqp: number; firstName: string; lastName: string | null }[];
  escapePoints: { uid: string; name: string }[];
  startDate: string | null;
  numberOfDays: number | null;
  endDate: string | null;
  status: string;
}

export async function getEscapes(): Promise<Escape[]> {
  return backendJson<Escape[]>("/escape");
}

export async function getEscapeById(id: number): Promise<Escape> {
  return backendJson<Escape>(`/escape/${id}`);
}
