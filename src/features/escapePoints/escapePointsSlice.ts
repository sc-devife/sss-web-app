import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import type { EscapePoint } from "@/features/escapePoints/types";
import { fetchEscapePoints, createEscapePoint, updateEscapePoint, deleteEscapePoint } from "@/features/escapePoints/escapePointsThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface EscapePointsState {
  items: EscapePoint[];
  status: RequestStatus;
  error: string | null;

  saveStatus: RequestStatus;
  saveError: string | null;

  deleteStatus: RequestStatus;
  deleteError: string | null;
}

const initialState: EscapePointsState = {
  items: [],
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
  deleteStatus: "idle",
  deleteError: null,
};

const escapePointsSlice = createSlice({
  name: "escapePoints",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEscapePoints.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchEscapePoints.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchEscapePoints.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load escape points";
      })

      .addCase(deleteEscapePoint.pending, (state) => {
        state.deleteStatus = "loading";
        state.deleteError = null;
      })
      .addCase(deleteEscapePoint.fulfilled, (state) => {
        state.deleteStatus = "succeeded";
      })
      .addCase(deleteEscapePoint.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload ?? "Failed to archive escape point";
      })

      .addMatcher(isAnyOf(createEscapePoint.pending, updateEscapePoint.pending), (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addMatcher(isAnyOf(createEscapePoint.fulfilled, updateEscapePoint.fulfilled), (state) => {
        state.saveStatus = "succeeded";
      })
      .addMatcher(isAnyOf(createEscapePoint.rejected, updateEscapePoint.rejected), (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to save escape point";
      });
  },
});

export const { resetSaveStatus } = escapePointsSlice.actions;
export default escapePointsSlice.reducer;
