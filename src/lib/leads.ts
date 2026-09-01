import { backendJson } from "@/lib/backend";

export type LeadSourceType = "DIRECT" | "AGENCY";

export interface LeadAgencyDetails {
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  streetAddress: string | null;
  locality: string | null;
  landmark: string | null;
  billingName: string | null;
  additionalBillingDetails: string | null;
}

export interface Lead {
  uid: string;
  name: string;
  email: string;
  phone: string;
  destination: string | null;
  numberOfPeople: number | null;
  travelDate: string | null;
  durationDays: number | null;
  budget: number | null;
  status: string;
  // DIRECT | AGENCY — sourceChannel only applies when DIRECT, agencyDetails
  // only when AGENCY. Leads are never individually assigned — assignment
  // lives on Escape once converted (see lib/escapes.ts).
  sourceType: LeadSourceType | null;
  sourceChannel: string | null;
  sourceRefId: string | null;
  agencyDetails: LeadAgencyDetails | null;
  escapePointId: string | null;
  isPriority: boolean | null;
  originCity: string | null;
  travelType: string | null;
  followUpDueDate: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AuditLogEntry {
  action: string;
  performedBy: number | null;
  performedByName: string | null;
  previousValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export async function getLeads(): Promise<Lead[]> {
  return backendJson<Lead[]>("/leads");
}

export async function getLeadByUid(uid: string): Promise<Lead> {
  return backendJson<Lead>(`/leads/${uid}`);
}
