import { createSlice } from "@reduxjs/toolkit";
import type { FollowUp } from "@/features/followups/types";
import {
  fetchFollowUps,
  fetchFollowUpCount,
  fetchFollowUpsForLead,
  fetchFollowUpsForEscape,
  createFollowUp,
  updateFollowUp,
  updateFollowUpStatus,
} from "@/features/followups/followupsThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface FollowUpsState {
  items: FollowUp[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  status: RequestStatus;
  error: string | null;
  currentRequestId: string | null;

  count: number;

  leadFollowUps: FollowUp[];
  leadFollowUpsStatus: RequestStatus;

  escapeFollowUps: FollowUp[];
  escapeFollowUpsStatus: RequestStatus;

  createStatus: RequestStatus;
  createError: string | null;
}

const initialState: FollowUpsState = {
  items: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
  status: "idle",
  error: null,
  currentRequestId: null,
  count: 0,
  leadFollowUps: [],
  leadFollowUpsStatus: "idle",
  escapeFollowUps: [],
  escapeFollowUpsStatus: "idle",
  createStatus: "idle",
  createError: null,
};

const followupsSlice = createSlice({
  name: "followups",
  initialState,
  reducers: {
    resetCreateStatus(state) {
      state.createStatus = "idle";
      state.createError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFollowUps.pending, (state, action) => {
        state.currentRequestId = action.meta.requestId;
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchFollowUps.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.currentRequestId) return;
        state.status = "succeeded";
        state.items = action.payload.content;
        state.page = action.payload.number;
        state.size = action.payload.size;
        state.totalElements = action.payload.totalElements;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchFollowUps.rejected, (state, action) => {
        if (action.meta.requestId !== state.currentRequestId) return;
        state.status = "failed";
        state.error = action.payload ?? "Failed to load follow-ups";
      })

      .addCase(fetchFollowUpCount.fulfilled, (state, action) => {
        state.count = action.payload;
      })

      .addCase(fetchFollowUpsForLead.pending, (state) => {
        state.leadFollowUpsStatus = "loading";
      })
      .addCase(fetchFollowUpsForLead.fulfilled, (state, action) => {
        state.leadFollowUpsStatus = "succeeded";
        state.leadFollowUps = action.payload;
      })
      .addCase(fetchFollowUpsForLead.rejected, (state) => {
        state.leadFollowUpsStatus = "failed";
      })

      .addCase(fetchFollowUpsForEscape.pending, (state) => {
        state.escapeFollowUpsStatus = "loading";
      })
      .addCase(fetchFollowUpsForEscape.fulfilled, (state, action) => {
        state.escapeFollowUpsStatus = "succeeded";
        state.escapeFollowUps = action.payload;
      })
      .addCase(fetchFollowUpsForEscape.rejected, (state) => {
        state.escapeFollowUpsStatus = "failed";
      })

      .addCase(createFollowUp.pending, (state) => {
        state.createStatus = "loading";
        state.createError = null;
      })
      .addCase(createFollowUp.fulfilled, (state) => {
        state.createStatus = "succeeded";
      })
      .addCase(createFollowUp.rejected, (state, action) => {
        state.createStatus = "failed";
        state.createError = action.payload ?? "Failed to create follow-up";
      })

      // Shares createStatus/createError with createFollowUp — one form, edit
      // or create, never both in flight at once (same convention as leads).
      .addCase(updateFollowUp.pending, (state) => {
        state.createStatus = "loading";
        state.createError = null;
      })
      .addCase(updateFollowUp.fulfilled, (state) => {
        state.createStatus = "succeeded";
      })
      .addCase(updateFollowUp.rejected, (state, action) => {
        state.createStatus = "failed";
        state.createError = action.payload ?? "Failed to update follow-up";
      })

      .addCase(updateFollowUpStatus.fulfilled, (state, action) => {
        // Reflected optimistically-in-place wherever the row is currently
        // held, so the table/section doesn't need a full refetch just to
        // show the new status immediately.
        const updated = action.payload;
        for (const list of [state.items, state.leadFollowUps, state.escapeFollowUps]) {
          const idx = list.findIndex((f) => f.uid === updated.uid);
          if (idx !== -1) list[idx] = updated;
        }
      });
  },
});

export const { resetCreateStatus } = followupsSlice.actions;
export default followupsSlice.reducer;
