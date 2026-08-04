import type { RootState } from "@/store/store";

export const selectOrgUsers = (state: RootState) => state.users.items;
export const selectOrgUsersStatus = (state: RootState) => state.users.status;
export const selectOrgUsersError = (state: RootState) => state.users.error;

export const selectAssignableRoles = (state: RootState) => state.users.roles;
export const selectAssignableRolesStatus = (state: RootState) => state.users.rolesStatus;
export const selectAssignableRolesError = (state: RootState) => state.users.rolesError;

export const selectPendingInvitations = (state: RootState) => state.users.invitations;
export const selectPendingInvitationsStatus = (state: RootState) => state.users.invitationsStatus;
export const selectPendingInvitationsError = (state: RootState) => state.users.invitationsError;

export const selectInviteUserStatus = (state: RootState) => state.users.inviteStatus;
export const selectInviteUserError = (state: RootState) => state.users.inviteError;

export const selectAssignmentSettingsStatus = (state: RootState) => state.users.assignmentSettingsStatus;
export const selectAssignmentSettingsError = (state: RootState) => state.users.assignmentSettingsError;
