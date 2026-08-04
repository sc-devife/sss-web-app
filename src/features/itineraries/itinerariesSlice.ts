import { createSlice } from "@reduxjs/toolkit";
import type { Itinerary } from "@/features/itineraries/types";
import { fetchItinerariesForTrip, createItinerary, deleteItinerary, newItineraryVersion } from "@/features/itineraries/itinerariesThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface ItinerariesState {
  items: Itinerary[];
  status: RequestStatus;
  error: string | null;

  saveStatus: RequestStatus;
  saveError: string | null;

  deleteStatus: RequestStatus;
  deleteError: string | null;

  newVersionStatus: RequestStatus;
  newVersionError: string | null;
}

const initialState: ItinerariesState = {
  items: [],
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
  deleteStatus: "idle",
  deleteError: null,
  newVersionStatus: "idle",
  newVersionError: null,
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
      .addCase(fetchItinerariesForTrip.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchItinerariesForTrip.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchItinerariesForTrip.rejected, (state, action) => {
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

      .addCase(newItineraryVersion.pending, (state) => {
        state.newVersionStatus = "loading";
        state.newVersionError = null;
      })
      .addCase(newItineraryVersion.fulfilled, (state) => {
        state.newVersionStatus = "succeeded";
      })
      .addCase(newItineraryVersion.rejected, (state, action) => {
        state.newVersionStatus = "failed";
        state.newVersionError = action.payload ?? "Failed to create new version";
      });
  },
});

export const { resetSaveStatus } = itinerariesSlice.actions;
export default itinerariesSlice.reducer;
