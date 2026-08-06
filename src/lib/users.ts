import { backendJson } from "@/lib/backend";

export interface AppUser {
  seqp: number;
  uid: string;
  name: string;
  email: string;
  first_name: string;
  last_name: string;
  contact_number: string | null;
  roles: { role: { name: string; label: string } }[];
  isSpecialist: boolean | null;
  specialistEscapePoints: number[] | null;
  maxConcurrentAssignments: number | null;
  eligibleForPriorityLeads: boolean | null;
  acceptingLeads: boolean | null;
  blocked: boolean | null;
}

export interface PendingInvitation {
  seqp: number;
  uid: string;
  email: string;
  expires_set: string;
  roles: string[] | null;
}

export interface AppRole {
  seqp: number;
  uid: string;
  name: string;
  label: string;
}

export async function getOrgUsers(): Promise<AppUser[]> {
  return backendJson<AppUser[]>("/users/all");
}

export async function getAssignableRoles(): Promise<AppRole[]> {
  return backendJson<AppRole[]>("/roles");
}

export async function getPendingInvitations(): Promise<PendingInvitation[]> {
  return backendJson<PendingInvitation[]>("/newuser/invite/pending");
}
