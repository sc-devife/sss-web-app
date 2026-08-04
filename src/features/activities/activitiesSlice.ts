import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import type { Activity } from "@/features/activities/types";
import { fetchActivities, createActivity, updateActivity, deleteActivity } from "@/features/activities/activitiesThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface ActivitiesState {
  items: Activity[];
  status: RequestStatus;
  error: string | null;

  saveStatus: RequestStatus;
  saveError: string | null;

  deleteStatus: RequestStatus;
  deleteError: string | null;
}

const initialState: ActivitiesState = {
  items: [],
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
  deleteStatus: "idle",
  deleteError: null,
};

const activitiesSlice = createSlice({
  name: "activities",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load activities";
      })

      .addCase(deleteActivity.pending, (state) => {
        state.deleteStatus = "loading";
        state.deleteError = null;
      })
      .addCase(deleteActivity.fulfilled, (state) => {
        state.deleteStatus = "succeeded";
      })
      .addCase(deleteActivity.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload ?? "Failed to archive activity";
      })

      .addMatcher(isAnyOf(createActivity.pending, updateActivity.pending), (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addMatcher(isAnyOf(createActivity.fulfilled, updateActivity.fulfilled), (state) => {
        state.saveStatus = "succeeded";
      })
      .addMatcher(isAnyOf(createActivity.rejected, updateActivity.rejected), (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to save activity";
      });
  },
});

export const { resetSaveStatus } = activitiesSlice.actions;
export default activitiesSlice.reducer;
