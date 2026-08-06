import { backendJson } from "@/lib/backend";

export interface Lead {
  seqp: number;
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
  assignmentReason: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AuditLogEntry {
  action: string;
  performedBy: number | null;
  previousValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export async function getLeads(): Promise<Lead[]> {
  return backendJson<Lead[]>("/leads");
}
