import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import type { UserSessionInfo } from "@/features/sessions/types";
import { fetchMySessions, revokeSession, revokeOtherSessions } from "@/features/sessions/sessionsThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface SessionsState {
  items: UserSessionInfo[];
  status: RequestStatus;
  error: string | null;

  actionStatus: RequestStatus;
  actionError: string | null;
}

const initialState: SessionsState = {
  items: [],
  status: "idle",
  error: null,
  actionStatus: "idle",
  actionError: null,
};

const sessionsSlice = createSlice({
  name: "sessions",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMySessions.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMySessions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchMySessions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load active sessions";
      })

      .addMatcher(isAnyOf(revokeSession.pending, revokeOtherSessions.pending), (state) => {
        state.actionStatus = "loading";
        state.actionError = null;
      })
      .addMatcher(isAnyOf(revokeSession.fulfilled, revokeOtherSessions.fulfilled), (state) => {
        state.actionStatus = "succeeded";
      })
      .addMatcher(isAnyOf(revokeSession.rejected, revokeOtherSessions.rejected), (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload ?? "Failed to update sessions";
      });
  },
});

export default sessionsSlice.reducer;
