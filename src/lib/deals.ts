import { backendJson } from "@/lib/backend";

export interface Deal {
  uid: string;
  escapeUid: string;
  acceptedQuoteUid: string;
  status: string;
  createdAt: string;
}

export async function getDealForEscape(escapeUid: string): Promise<Deal | null> {
  try {
    return await backendJson<Deal>(`/api/deals?escapeUid=${escapeUid}`);
  } catch {
    return null;
  }
}

export async function getDealByUid(uid: string): Promise<Deal> {
  return backendJson<Deal>(`/api/deals/${uid}`);
}
