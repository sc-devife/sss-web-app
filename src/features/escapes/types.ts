export type { Escape } from "@/lib/escapes";

export interface EscapeAuditLogEntry {
  action: string;
  previousValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface AdvanceEscapePayload {
  escapeUid: string;
  targetStatus: string;
}

export interface CancelEscapePayload {
  escapeUid: string;
  reason: string;
}

export interface AddEscapeTravellerPayload {
  escapeUid: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface UpdateTravellerPayload {
  travellerUid: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface DeleteTravellerPayload {
  escapeUid: string;
  travellerUid: string;
}
