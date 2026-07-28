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
  specialistDestinations: number[] | null;
  maxConcurrentAssignments: number | null;
  eligibleForPriorityLeads: boolean | null;
  acceptingLeads: boolean | null;
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
