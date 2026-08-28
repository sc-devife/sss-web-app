import type { LeadAgencyDetails, LeadSourceType } from "@/lib/leads";

export type { Lead, AuditLogEntry, LeadSourceType, LeadAgencyDetails } from "@/lib/leads";

export interface CreateLeadPayload {
  name: string;
  email: string;
  phone: string;
  destination: string | null;
  escapePointId: string | null;
  numberOfPeople: number | null;
  travelDate: string | null;
  durationDays: number | null;
  budget: number | null;
  originCity: string | null;
  travelType: string | null;
  isPriority: boolean;
  notes: string | null;
  sourceType: LeadSourceType;
  sourceChannel?: string | null;
  agencyDetails?: LeadAgencyDetails | null;
}

export type LeadReasonAction = "disqualify" | "mark-lost" | "mark-duplicate";

export interface LeadReasonActionPayload {
  leadUid: string;
  action: LeadReasonAction;
  reason: string;
}

export interface SetLeadFollowUpDueDatePayload {
  leadUid: string;
  followUpDueDate: string | null;
}

export interface ConvertLeadToEscapePayload {
  leadUid: string;
  travellerUids: string[];
  escapePointUids: string[];
  startDate: string;
  numberOfDays: number;
}

export interface ConvertLeadToEscapeResult {
  uid: string;
}
