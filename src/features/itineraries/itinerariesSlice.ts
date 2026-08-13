import { createSlice } from "@reduxjs/toolkit";
import type { Itinerary } from "@/features/itineraries/types";
import { fetchItinerariesForEscape, createItinerary, updateItinerary, deleteItinerary, duplicateItinerary } from "@/features/itineraries/itinerariesThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface ItinerariesState {
  items: Itinerary[];
  status: RequestStatus;
  error: string | null;

  saveStatus: RequestStatus;
  saveError: string | null;

  deleteStatus: RequestStatus;
  deleteError: string | null;

  duplicateStatus: RequestStatus;
  duplicateError: string | null;
}

const initialState: ItinerariesState = {
  items: [],
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
  deleteStatus: "idle",
  deleteError: null,
  duplicateStatus: "idle",
  duplicateError: null,
};

const itinerariesSlice = createSlice({
  name: "itineraries",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItinerariesForEscape.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchItinerariesForEscape.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchItinerariesForEscape.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load itineraries";
      })

      .addCase(createItinerary.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(createItinerary.fulfilled, (state) => {
        state.saveStatus = "succeeded";
      })
      .addCase(createItinerary.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to create itinerary";
      })

      .addCase(updateItinerary.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.uid === action.payload.uid);
        if (idx !== -1) state.items[idx] = action.payload;
      })

      .addCase(deleteItinerary.pending, (state) => {
        state.deleteStatus = "loading";
        state.deleteError = null;
      })
      .addCase(deleteItinerary.fulfilled, (state) => {
        state.deleteStatus = "succeeded";
      })
      .addCase(deleteItinerary.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload ?? "Failed to delete itinerary";
      })

      .addCase(duplicateItinerary.pending, (state) => {
        state.duplicateStatus = "loading";
        state.duplicateError = null;
      })
      .addCase(duplicateItinerary.fulfilled, (state) => {
        state.duplicateStatus = "succeeded";
      })
      .addCase(duplicateItinerary.rejected, (state, action) => {
        state.duplicateStatus = "failed";
        state.duplicateError = action.payload ?? "Failed to duplicate itinerary";
      });
  },
});

export const { resetSaveStatus } = itinerariesSlice.actions;
export default itinerariesSlice.reducer;
