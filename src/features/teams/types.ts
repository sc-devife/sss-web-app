import type { Team, TeamMember } from "@/lib/teams";

export type { Team, TeamMember };

export interface TeamPayload {
  name: string;
  description?: string;
  status?: string;
  specializedEscapePoints?: number[];
  teamLeadUserId?: number | null;
  maxConcurrentAssignments?: number | null;
}

export interface UpdateTeamPayload {
  uid: string;
  payload: TeamPayload;
}
