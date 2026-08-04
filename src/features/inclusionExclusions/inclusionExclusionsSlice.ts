import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import type { InclusionExclusionItem } from "@/features/inclusionExclusions/types";
import {
  fetchInclusionExclusions,
  createInclusionExclusion,
  updateInclusionExclusion,
  deactivateInclusionExclusion,
  fetchSelectableInclusionExclusions,
} from "@/features/inclusionExclusions/inclusionExclusionsThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface InclusionExclusionsState {
  items: InclusionExclusionItem[];
  status: RequestStatus;
  error: string | null;

  saveStatus: RequestStatus;
  saveError: string | null;

  deactivateStatus: RequestStatus;
  deactivateError: string | null;

  selectableByKey: Record<string, InclusionExclusionItem[]>;
  selectableStatusByKey: Record<string, RequestStatus>;
}

const initialState: InclusionExclusionsState = {
  items: [],
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
  deactivateStatus: "idle",
  deactivateError: null,
  selectableByKey: {},
  selectableStatusByKey: {},
};

const inclusionExclusionsSlice = createSlice({
  name: "inclusionExclusions",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInclusionExclusions.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchInclusionExclusions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchInclusionExclusions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load items";
      })

      .addCase(deactivateInclusionExclusion.pending, (state) => {
        state.deactivateStatus = "loading";
        state.deactivateError = null;
      })
      .addCase(deactivateInclusionExclusion.fulfilled, (state) => {
        state.deactivateStatus = "succeeded";
      })
      .addCase(deactivateInclusionExclusion.rejected, (state, action) => {
        state.deactivateStatus = "failed";
        state.deactivateError = action.payload ?? "Failed to deactivate";
      })

      .addCase(fetchSelectableInclusionExclusions.pending, (state, action) => {
        const key = `${action.meta.arg.itineraryUid}:${action.meta.arg.type}`;
        state.selectableStatusByKey[key] = "loading";
      })
      .addCase(fetchSelectableInclusionExclusions.fulfilled, (state, action) => {
        state.selectableStatusByKey[action.payload.key] = "succeeded";
        state.selectableByKey[action.payload.key] = action.payload.items;
      })
      .addCase(fetchSelectableInclusionExclusions.rejected, (state, action) => {
        const key = `${action.meta.arg.itineraryUid}:${action.meta.arg.type}`;
        state.selectableStatusByKey[key] = "failed";
      })

      .addMatcher(isAnyOf(createInclusionExclusion.pending, updateInclusionExclusion.pending), (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addMatcher(isAnyOf(createInclusionExclusion.fulfilled, updateInclusionExclusion.fulfilled), (state) => {
        state.saveStatus = "succeeded";
      })
      .addMatcher(isAnyOf(createInclusionExclusion.rejected, updateInclusionExclusion.rejected), (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to save";
      });
  },
});

export const { resetSaveStatus } = inclusionExclusionsSlice.actions;
export default inclusionExclusionsSlice.reducer;
