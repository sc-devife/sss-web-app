export type { Escape } from "@/lib/escapes";

export interface EscapeAuditLogEntry {
  action: string;
  performedBy: number | null;
  performedByName: string | null;
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

// POST /escape/{id}/hold — idempotent: same call sets Hold the first time
// and just updates holdDate on later calls (Docs tab's "already on Hold,
// change the date" flow).
export interface HoldEscapePayload {
  escapeUid: string;
  holdDate: string;
}

export interface AddEscapeTravellerPayload {
  escapeUid: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  salutation?: string;
  dateOfBirth?: string;
  nationality?: string;
  type?: string;
  age?: number;
  passportNumber?: string;
  passportExpiry?: string;
  passportIssuingCountry?: string;
}

export interface UpdateTravellerPayload {
  travellerUid: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  salutation?: string;
  dateOfBirth?: string;
  nationality?: string;
  type?: string;
  age?: number;
  passportNumber?: string;
  passportExpiry?: string;
  passportIssuingCountry?: string;
}

export interface DeleteTravellerPayload {
  escapeUid: string;
  travellerUid: string;
}

// Deliberately minimal — the backend endpoint (PUT /escape/update/{id}) is a
// full-object update, but travellerUids/escapePointUids are only applied
// when present, so omitting them leaves those untouched. status is
// ignored server-side by design (goes through the lifecycle endpoints
// instead), so it's not part of this payload either.
export interface UpdateEscapeDurationPayload {
  escapeUid: string;
  leadUid: string;
  startDate: string | null;
  numberOfDays: number;
}

// PUT /escape/{id}/summary-notes — its own small endpoint (Section 8's
// Summary tab), not the full-object PUT above, so saving these never
// touches lead/travellers/dates/etc.
export interface UpdateEscapeSummaryNotesPayload {
  escapeUid: string;
  internalComments: string | null;
  remarkForLead: string | null;
}
