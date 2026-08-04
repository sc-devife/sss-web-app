import { createSlice } from "@reduxjs/toolkit";
import type { AppUser, AppRole, PendingInvitation } from "@/features/users/types";
import {
  fetchUsers,
  fetchAssignableRoles,
  fetchPendingInvitations,
  inviteUser,
  cancelInvitation,
  setUserBlockedStatus,
  updateUserRoles,
  updateAgentAssignmentSettings,
} from "@/features/users/usersThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface UsersState {
  items: AppUser[];
  status: RequestStatus;
  error: string | null;

  roles: AppRole[];
  rolesStatus: RequestStatus;
  rolesError: string | null;

  invitations: PendingInvitation[];
  invitationsStatus: RequestStatus;
  invitationsError: string | null;

  inviteStatus: RequestStatus;
  inviteError: string | null;

  cancelStatus: RequestStatus;
  cancelError: string | null;

  blockStatus: RequestStatus;
  blockError: string | null;

  rolesUpdateStatus: RequestStatus;
  rolesUpdateError: string | null;

  assignmentSettingsStatus: RequestStatus;
  assignmentSettingsError: string | null;
}

const initialState: UsersState = {
  items: [],
  status: "idle",
  error: null,
  roles: [],
  rolesStatus: "idle",
  rolesError: null,
  invitations: [],
  invitationsStatus: "idle",
  invitationsError: null,
  inviteStatus: "idle",
  inviteError: null,
  cancelStatus: "idle",
  cancelError: null,
  blockStatus: "idle",
  blockError: null,
  rolesUpdateStatus: "idle",
  rolesUpdateError: null,
  assignmentSettingsStatus: "idle",
  assignmentSettingsError: null,
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    resetInviteStatus(state) {
      state.inviteStatus = "idle";
      state.inviteError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load users";
      })

      .addCase(fetchAssignableRoles.pending, (state) => {
        state.rolesStatus = "loading";
        state.rolesError = null;
      })
      .addCase(fetchAssignableRoles.fulfilled, (state, action) => {
        state.rolesStatus = "succeeded";
        state.roles = action.payload;
      })
      .addCase(fetchAssignableRoles.rejected, (state, action) => {
        state.rolesStatus = "failed";
        state.rolesError = action.payload ?? "Failed to load roles";
      })

      .addCase(fetchPendingInvitations.pending, (state) => {
        state.invitationsStatus = "loading";
        state.invitationsError = null;
      })
      .addCase(fetchPendingInvitations.fulfilled, (state, action) => {
        state.invitationsStatus = "succeeded";
        state.invitations = action.payload;
      })
      .addCase(fetchPendingInvitations.rejected, (state, action) => {
        state.invitationsStatus = "failed";
        state.invitationsError = action.payload ?? "Failed to load invitations";
      })

      .addCase(inviteUser.pending, (state) => {
        state.inviteStatus = "loading";
        state.inviteError = null;
      })
      .addCase(inviteUser.fulfilled, (state) => {
        state.inviteStatus = "succeeded";
      })
      .addCase(inviteUser.rejected, (state, action) => {
        state.inviteStatus = "failed";
        state.inviteError = action.payload ?? "Failed to send invitation";
      })

      .addCase(cancelInvitation.pending, (state) => {
        state.cancelStatus = "loading";
        state.cancelError = null;
      })
      .addCase(cancelInvitation.fulfilled, (state) => {
        state.cancelStatus = "succeeded";
      })
      .addCase(cancelInvitation.rejected, (state, action) => {
        state.cancelStatus = "failed";
        state.cancelError = action.payload ?? "Failed to cancel invitation";
      })

      .addCase(setUserBlockedStatus.pending, (state) => {
        state.blockStatus = "loading";
        state.blockError = null;
      })
      .addCase(setUserBlockedStatus.fulfilled, (state) => {
        state.blockStatus = "succeeded";
      })
      .addCase(setUserBlockedStatus.rejected, (state, action) => {
        state.blockStatus = "failed";
        state.blockError = action.payload ?? "Failed to update user status";
      })

      .addCase(updateUserRoles.pending, (state) => {
        state.rolesUpdateStatus = "loading";
        state.rolesUpdateError = null;
      })
      .addCase(updateUserRoles.fulfilled, (state) => {
        state.rolesUpdateStatus = "succeeded";
      })
      .addCase(updateUserRoles.rejected, (state, action) => {
        state.rolesUpdateStatus = "failed";
        state.rolesUpdateError = action.payload ?? "Failed to update roles";
      })

      .addCase(updateAgentAssignmentSettings.pending, (state) => {
        state.assignmentSettingsStatus = "loading";
        state.assignmentSettingsError = null;
      })
      .addCase(updateAgentAssignmentSettings.fulfilled, (state) => {
        state.assignmentSettingsStatus = "succeeded";
      })
      .addCase(updateAgentAssignmentSettings.rejected, (state, action) => {
        state.assignmentSettingsStatus = "failed";
        state.assignmentSettingsError = action.payload ?? "Failed to save agent settings";
      });
  },
});

export const { resetInviteStatus } = usersSlice.actions;
export default usersSlice.reducer;
