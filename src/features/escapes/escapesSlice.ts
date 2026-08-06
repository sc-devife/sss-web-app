import { createSlice } from "@reduxjs/toolkit";
import type { Escape, EscapeAuditLogEntry } from "@/features/escapes/types";
import { fetchEscapes, fetchEscapeById, fetchEscapeAuditLog, advanceEscapeStatus, cancelEscape } from "@/features/escapes/escapesThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface EscapesState {
  items: Escape[];
  status: RequestStatus;
  error: string | null;

  currentEscape: Escape | null;
  currentEscapeStatus: RequestStatus;
  currentEscapeError: string | null;

  auditLog: EscapeAuditLogEntry[] | null;
  auditLogStatus: RequestStatus;

  advanceStatus: RequestStatus;
  advanceError: string | null;

  cancelStatus: RequestStatus;
  cancelError: string | null;
}

const initialState: EscapesState = {
  items: [],
  status: "idle",
  error: null,
  currentEscape: null,
  currentEscapeStatus: "idle",
  currentEscapeError: null,
  auditLog: null,
  auditLogStatus: "idle",
  advanceStatus: "idle",
  advanceError: null,
  cancelStatus: "idle",
  cancelError: null,
};

const escapesSlice = createSlice({
  name: "escapes",
  initialState,
  reducers: {
    resetAdvanceStatus(state) {
      state.advanceStatus = "idle";
      state.advanceError = null;
    },
    resetCancelStatus(state) {
      state.cancelStatus = "idle";
      state.cancelError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEscapes.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchEscapes.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchEscapes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load escapes";
      })

      .addCase(fetchEscapeById.pending, (state) => {
        state.currentEscapeStatus = "loading";
        state.currentEscapeError = null;
      })
      .addCase(fetchEscapeById.fulfilled, (state, action) => {
        state.currentEscapeStatus = "succeeded";
        state.currentEscape = action.payload;
      })
      .addCase(fetchEscapeById.rejected, (state, action) => {
        state.currentEscapeStatus = "failed";
        state.currentEscapeError = action.payload ?? "Failed to load escape";
      })

      .addCase(fetchEscapeAuditLog.pending, (state) => {
        state.auditLogStatus = "loading";
      })
      .addCase(fetchEscapeAuditLog.fulfilled, (state, action) => {
        state.auditLogStatus = "succeeded";
        state.auditLog = action.payload;
      })
      .addCase(fetchEscapeAuditLog.rejected, (state) => {
        state.auditLogStatus = "failed";
        state.auditLog = [];
      })

      .addCase(advanceEscapeStatus.pending, (state) => {
        state.advanceStatus = "loading";
        state.advanceError = null;
      })
      .addCase(advanceEscapeStatus.fulfilled, (state) => {
        state.advanceStatus = "succeeded";
      })
      .addCase(advanceEscapeStatus.rejected, (state, action) => {
        state.advanceStatus = "failed";
        state.advanceError = action.payload ?? "Failed to advance status";
      })

      .addCase(cancelEscape.pending, (state) => {
        state.cancelStatus = "loading";
        state.cancelError = null;
      })
      .addCase(cancelEscape.fulfilled, (state) => {
        state.cancelStatus = "succeeded";
      })
      .addCase(cancelEscape.rejected, (state, action) => {
        state.cancelStatus = "failed";
        state.cancelError = action.payload ?? "Failed to cancel escape";
      });
  },
});

export const { resetAdvanceStatus, resetCancelStatus } = escapesSlice.actions;
export default escapesSlice.reducer;
