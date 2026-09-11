import type { LeadAgencyDetails, LeadSourceType } from "@/lib/leads";
import type { Page } from "@/lib/pagination";
import type { Lead } from "@/lib/leads";

export type { Lead, AuditLogEntry, LeadSourceType, LeadAgencyDetails } from "@/lib/leads";
export type { Page } from "@/lib/pagination";

// Every filter GET /leads accepts — Search + Status + Month/Week/Day/All +
// pagination, all applied server-side (LeadsPanel is the only place that
// builds one of these; page is 0-based, matching the `page` query param).
export interface FetchLeadsParams {
  search?: string;
  status?: string;
  /** The Status dropdown's "Priority" option — filters Lead.isPriority, a separate field from status. */
  priority?: boolean;
  from?: string;
  to?: string;
  /** The Escape Point toolbar filter (between Search and Status) — an EscapePoint uid. */
  escapePointId?: string;
  /** More Filters' Source multi-select — DIRECT sourceChannel values plus "agency". */
  source?: string[];
  /** More Filters' Archive checkbox — false (default) is non-archived leads only, true is archived only. */
  archive?: boolean;
  page?: number;
  size?: number;
}

export type LeadsPage = Page<Lead>;

export interface CreateLeadPayload {
  name: string;
  email: string;
  phone: string;
  destination: string | null;
  escapePointIds: string[];
  numberOfPeople: number | null;
  travelDate: string | null;
  durationNights: number | null;
  budget: number | null;
  originCity: string | null;
  travelType: string | null;
  isPriority: boolean;
  notes: string | null;
  sourceType: LeadSourceType;
  sourceChannel?: string | null;
  agencyDetails?: LeadAgencyDetails | null;
}

export interface UpdateLeadPayload extends CreateLeadPayload {
  leadUid: string;
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
