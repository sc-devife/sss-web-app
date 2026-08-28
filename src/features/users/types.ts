import type { AppUser, AppUserTeamRef, PendingInvitation, AppRole } from "@/lib/users";

export type { AppUser, AppUserTeamRef, PendingInvitation, AppRole };

export interface InviteUserPayload {
  email: string;
  roles: string[];
}

export interface UpdateUserRolesPayload {
  uid: string;
  roles: string[];
}

export interface UpdateUserTeamsPayload {
  uid: string;
  teams: string[];
}

export interface SetUserBlockedPayload {
  uid: string;
  blocked: boolean;
}

export interface AgentAssignmentSettings {
  isSpecialist: boolean;
  specialistEscapePoints: number[];
  maxConcurrentAssignments: number | null;
  eligibleForPriorityLeads: boolean;
  acceptingLeads: boolean;
}

export interface UpdateAgentAssignmentSettingsPayload {
  uid: string;
  settings: AgentAssignmentSettings;
}
