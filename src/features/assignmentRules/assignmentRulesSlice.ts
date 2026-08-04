import { createSlice } from "@reduxjs/toolkit";
import type { PriorityCalendarEntry } from "@/features/assignmentRules/types";
import {
  fetchPriorityCalendarEntries,
  createPriorityCalendarEntry,
  deletePriorityCalendarEntry,
  toggleAutoAssign,
} from "@/features/assignmentRules/assignmentRulesThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface AssignmentRulesState {
  items: PriorityCalendarEntry[];
  status: RequestStatus;
  error: string | null;

  saveStatus: RequestStatus;
  saveError: string | null;

  deleteStatus: RequestStatus;
  deleteError: string | null;

  toggleStatus: RequestStatus;
  toggleError: string | null;
}

const initialState: AssignmentRulesState = {
  items: [],
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
  deleteStatus: "idle",
  deleteError: null,
  toggleStatus: "idle",
  toggleError: null,
};

const assignmentRulesSlice = createSlice({
  name: "assignmentRules",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPriorityCalendarEntries.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPriorityCalendarEntries.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchPriorityCalendarEntries.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load priority calendar";
      })

      .addCase(createPriorityCalendarEntry.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(createPriorityCalendarEntry.fulfilled, (state) => {
        state.saveStatus = "succeeded";
      })
      .addCase(createPriorityCalendarEntry.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to add season";
      })

      .addCase(deletePriorityCalendarEntry.pending, (state) => {
        state.deleteStatus = "loading";
        state.deleteError = null;
      })
      .addCase(deletePriorityCalendarEntry.fulfilled, (state) => {
        state.deleteStatus = "succeeded";
      })
      .addCase(deletePriorityCalendarEntry.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload ?? "Failed to remove season";
      })

      .addCase(toggleAutoAssign.pending, (state) => {
        state.toggleStatus = "loading";
        state.toggleError = null;
      })
      .addCase(toggleAutoAssign.fulfilled, (state) => {
        state.toggleStatus = "succeeded";
      })
      .addCase(toggleAutoAssign.rejected, (state, action) => {
        state.toggleStatus = "failed";
        state.toggleError = action.payload ?? "Failed to update setting";
      });
  },
});

export const { resetSaveStatus } = assignmentRulesSlice.actions;
export default assignmentRulesSlice.reducer;
