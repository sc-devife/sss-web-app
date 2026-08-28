import { backendJson } from "@/lib/backend";
import type { Lead } from "@/lib/leads";
import type { EscapePoint } from "@/lib/escape-points";
import type { Traveller } from "@/lib/travellers";

export interface Escape {
  uid: string;
  lead: Lead | null;
  travellers: Traveller[];
  // uid of the traveller who represents the lead's original/primary
  // contact, set once at escape-creation time. Null for escapes created
  // before this field existed — no traveller should be treated as primary
  // in that case.
  primaryTravellerUid: string | null;
  // locations/locationLabel are resolved by the backend directly (see
  // EscapePointLocationResolver) — no client-side enrichment needed.
  escapePoints: EscapePoint[];
  startDate: string | null;
  numberOfDays: number | null;
  endDate: string | null;
  status: string;
  // Assignment lives here, not on Lead — decided once, by the assignment
  // engine, at the moment a lead is converted. Leads themselves are never
  // individually assigned.
  assignedToUserId: number | null;
  assignedToUserName: string | null;
  assignmentReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export async function getEscapes(): Promise<Escape[]> {
  return backendJson<Escape[]>("/escape");
}

export async function getEscapeById(uid: string): Promise<Escape> {
  return backendJson<Escape>(`/escape/${uid}`);
}
