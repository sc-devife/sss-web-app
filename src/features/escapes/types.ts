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

// Deliberately minimal — the backend endpoint (PUT /escape/update/{id}) is a
// full-object update, but travellerUids/escapePointUids/sourceUid are only
// applied when present, so omitting them leaves those untouched. status is
// ignored server-side by design (goes through the lifecycle endpoints
// instead), so it's not part of this payload either.
export interface UpdateEscapeDurationPayload {
  escapeUid: string;
  leadUid: string;
  startDate: string | null;
  numberOfDays: number;
}
