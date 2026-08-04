import type { AppUser, PendingInvitation, AppRole } from "@/lib/users";

export type { AppUser, PendingInvitation, AppRole };

export interface InviteUserPayload {
  email: string;
  roles: string[];
}

export interface UpdateUserRolesPayload {
  uid: string;
  roles: string[];
}

export interface SetUserBlockedPayload {
  uid: string;
  blocked: boolean;
}

export interface AgentAssignmentSettings {
  isSpecialist: boolean;
  specialistDestinations: number[];
  maxConcurrentAssignments: number | null;
  eligibleForPriorityLeads: boolean;
  acceptingLeads: boolean;
}

export interface UpdateAgentAssignmentSettingsPayload {
  uid: string;
  settings: AgentAssignmentSettings;
}
