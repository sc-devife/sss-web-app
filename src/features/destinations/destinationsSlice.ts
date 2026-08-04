import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import type { Destination } from "@/features/destinations/types";
import { fetchDestinations, createDestination, updateDestination, deleteDestination } from "@/features/destinations/destinationsThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface DestinationsState {
  items: Destination[];
  status: RequestStatus;
  error: string | null;

  saveStatus: RequestStatus;
  saveError: string | null;

  deleteStatus: RequestStatus;
  deleteError: string | null;
}

const initialState: DestinationsState = {
  items: [],
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
  deleteStatus: "idle",
  deleteError: null,
};

const destinationsSlice = createSlice({
  name: "destinations",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDestinations.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchDestinations.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchDestinations.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load destinations";
      })

      .addCase(deleteDestination.pending, (state) => {
        state.deleteStatus = "loading";
        state.deleteError = null;
      })
      .addCase(deleteDestination.fulfilled, (state) => {
        state.deleteStatus = "succeeded";
      })
      .addCase(deleteDestination.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload ?? "Failed to archive destination";
      })

      .addMatcher(isAnyOf(createDestination.pending, updateDestination.pending), (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addMatcher(isAnyOf(createDestination.fulfilled, updateDestination.fulfilled), (state) => {
        state.saveStatus = "succeeded";
      })
      .addMatcher(isAnyOf(createDestination.rejected, updateDestination.rejected), (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to save destination";
      });
  },
});

export const { resetSaveStatus } = destinationsSlice.actions;
export default destinationsSlice.reducer;
