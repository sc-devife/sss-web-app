export type { Lead, AuditLogEntry } from "@/lib/leads";

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
}

export type LeadReasonAction = "disqualify" | "mark-lost" | "mark-duplicate";

export interface LeadReasonActionPayload {
  leadId: number;
  action: LeadReasonAction;
  reason: string;
}

export interface AssignLeadPayload {
  leadId: number;
  userId: number;
  reason?: string;
}

export interface ConvertLeadToEscapePayload {
  leadId: number;
  travellerIds: number[];
  escapePointIds: number[];
  startDate: string;
  numberOfDays: number;
}

export interface ConvertLeadToEscapeResult {
  seqp: number;
}
