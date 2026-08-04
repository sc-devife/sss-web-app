export type { Lead, AuditLogEntry } from "@/lib/leads";

export interface CreateLeadPayload {
  name: string;
  email: string;
  phone: string;
  destination: string | null;
  destinationId: string | null;
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

export interface ConvertLeadToTripPayload {
  leadId: number;
  travellerIds: number[];
  destinationIds: number[];
  startDate: string;
  numberOfDays: number;
}

export interface ConvertLeadToTripResult {
  seqp: number;
}
