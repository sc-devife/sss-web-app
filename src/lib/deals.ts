import { backendJson } from "@/lib/backend";

export interface Deal {
  uid: string;
  escapeId: number;
  acceptedQuoteUid: string;
  status: string;
  createdAt: string;
}

export async function getDealForEscape(escapeId: number): Promise<Deal | null> {
  try {
    return await backendJson<Deal>(`/api/deals?escapeId=${escapeId}`);
  } catch {
    return null;
  }
}

export async function getDealByUid(uid: string): Promise<Deal> {
  return backendJson<Deal>(`/api/deals/${uid}`);
}
