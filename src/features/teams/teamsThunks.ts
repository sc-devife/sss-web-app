import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { Team, TeamPayload, UpdateTeamPayload } from "@/features/teams/types";

export const fetchTeams = createAsyncThunk<Team[], void, { rejectValue: string }>(
  "teams/fetchTeams",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<Team[]>("/teams");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load teams"));
    }
  },
);

export const createTeam = createAsyncThunk<void, TeamPayload, { rejectValue: string }>(
  "teams/createTeam",
  async (payload, { rejectWithValue }) => {
    try {
      await clientApi.post("/teams", payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save team"));
    }
  },
);

export const updateTeam = createAsyncThunk<void, UpdateTeamPayload, { rejectValue: string }>(
  "teams/updateTeam",
  async ({ uid, payload }, { rejectWithValue }) => {
    try {
      await clientApi.put(`/teams/${uid}`, payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save team"));
    }
  },
);

export const deleteTeam = createAsyncThunk<void, string, { rejectValue: string }>(
  "teams/deleteTeam",
  async (uid, { rejectWithValue }) => {
    try {
      await clientApi.delete(`/teams/${uid}`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to deactivate team"));
    }
  },
);
