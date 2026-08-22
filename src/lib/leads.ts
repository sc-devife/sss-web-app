import { backendJson } from "@/lib/backend";

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
  sourceCode: string | null;
  sourceRefId: string | null;
  escapePointId: string | null;
  isPriority: boolean | null;
  originCity: string | null;
  travelType: string | null;
  assignedToUserId: number | null;
  assignedToUserName: string | null;
  assignmentReason: string | null;
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
