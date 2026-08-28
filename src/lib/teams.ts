import { backendJson } from "@/lib/backend";

export interface TeamMember {
  seqp: number;
  uid: string;
  name: string;
  email: string;
}

export interface Team {
  uid: string;
  orgId: number;
  name: string;
  description: string | null;
  status: string;
  specializedEscapePoints: number[] | null;
  teamLeadUserId: number | null;
  teamLeadUserName: string | null;
  maxConcurrentAssignments: number | null;
  members: TeamMember[];
  createdAt: string | null;
  updatedAt: string | null;
}

export async function getTeams(): Promise<Team[]> {
  return backendJson<Team[]>("/api/v1/teams");
}
