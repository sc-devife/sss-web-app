import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { UserSessionInfo } from "@/features/sessions/types";

export const fetchMySessions = createAsyncThunk<UserSessionInfo[], void, { rejectValue: string }>(
  "sessions/fetchMySessions",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<UserSessionInfo[]>("/users/me/sessions");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load active sessions"));
    }
  },
);

export const revokeSession = createAsyncThunk<void, string, { rejectValue: string }>(
  "sessions/revokeSession",
  async (sessionId, { rejectWithValue }) => {
    try {
      await clientApi.delete(`/users/me/sessions/${sessionId}`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to log out that session"));
    }
  },
);

export const revokeOtherSessions = createAsyncThunk<void, void, { rejectValue: string }>(
  "sessions/revokeOtherSessions",
  async (_arg, { rejectWithValue }) => {
    try {
      await clientApi.post("/users/me/sessions/revoke-others");
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to log out other sessions"));
    }
  },
);
