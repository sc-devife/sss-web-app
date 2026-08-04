import { createSlice } from "@reduxjs/toolkit";
import type { ReminderRule } from "@/features/reminderRules/types";
import { fetchReminderRules, createReminderRule, deleteReminderRule } from "@/features/reminderRules/reminderRulesThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface ReminderRulesState {
  items: ReminderRule[];
  status: RequestStatus;
  error: string | null;

  saveStatus: RequestStatus;
  saveError: string | null;

  deleteStatus: RequestStatus;
  deleteError: string | null;
}

const initialState: ReminderRulesState = {
  items: [],
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
  deleteStatus: "idle",
  deleteError: null,
};

const reminderRulesSlice = createSlice({
  name: "reminderRules",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReminderRules.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchReminderRules.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchReminderRules.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load reminder rules";
      })

      .addCase(createReminderRule.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(createReminderRule.fulfilled, (state) => {
        state.saveStatus = "succeeded";
      })
      .addCase(createReminderRule.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to add reminder rule";
      })

      .addCase(deleteReminderRule.pending, (state) => {
        state.deleteStatus = "loading";
        state.deleteError = null;
      })
      .addCase(deleteReminderRule.fulfilled, (state) => {
        state.deleteStatus = "succeeded";
      })
      .addCase(deleteReminderRule.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload ?? "Failed to delete reminder rule";
      });
  },
});

export const { resetSaveStatus } = reminderRulesSlice.actions;
export default reminderRulesSlice.reducer;
