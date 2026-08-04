import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type {
  AppUser,
  AppRole,
  PendingInvitation,
  InviteUserPayload,
  UpdateUserRolesPayload,
  SetUserBlockedPayload,
  UpdateAgentAssignmentSettingsPayload,
} from "@/features/users/types";

export const fetchUsers = createAsyncThunk<AppUser[], void, { rejectValue: string }>(
  "users/fetchUsers",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<AppUser[]>("/users");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load users"));
    }
  },
);

export const fetchAssignableRoles = createAsyncThunk<AppRole[], void, { rejectValue: string }>(
  "users/fetchAssignableRoles",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<AppRole[]>("/roles");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load roles"));
    }
  },
);

export const fetchPendingInvitations = createAsyncThunk<PendingInvitation[], void, { rejectValue: string }>(
  "users/fetchPendingInvitations",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<PendingInvitation[]>("/invitations");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load invitations"));
    }
  },
);

// Mutation thunks resolve to void — components re-dispatch the relevant fetch
// thunk on success to resync, matching the pre-migration router.refresh() behavior.

export const inviteUser = createAsyncThunk<void, InviteUserPayload, { rejectValue: string }>(
  "users/inviteUser",
  async (payload, { rejectWithValue }) => {
    try {
      await clientApi.post("/invitations", payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to send invitation"));
    }
  },
);

export const cancelInvitation = createAsyncThunk<void, number, { rejectValue: string }>(
  "users/cancelInvitation",
  async (invitationId, { rejectWithValue }) => {
    try {
      await clientApi.delete(`/invitations/${invitationId}`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to cancel invitation"));
    }
  },
);

export const setUserBlockedStatus = createAsyncThunk<void, SetUserBlockedPayload, { rejectValue: string }>(
  "users/setUserBlockedStatus",
  async ({ uid, blocked }, { rejectWithValue }) => {
    try {
      await clientApi.put(`/users/${uid}/block-status`, { blocked });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to update user status"));
    }
  },
);

export const updateUserRoles = createAsyncThunk<void, UpdateUserRolesPayload, { rejectValue: string }>(
  "users/updateUserRoles",
  async ({ uid, roles }, { rejectWithValue }) => {
    try {
      await clientApi.put(`/users/${uid}/roles`, { roles });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to update roles"));
    }
  },
);

export const updateAgentAssignmentSettings = createAsyncThunk<void, UpdateAgentAssignmentSettingsPayload, { rejectValue: string }>(
  "users/updateAgentAssignmentSettings",
  async ({ uid, settings }, { rejectWithValue }) => {
    try {
      await clientApi.put(`/users/${uid}/assignment-settings`, settings);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save agent settings"));
    }
  },
);
