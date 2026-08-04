import { createSlice } from "@reduxjs/toolkit";
import type { Trip, TripAuditLogEntry } from "@/features/trips/types";
import { fetchTrips, fetchTripById, fetchTripAuditLog, advanceTripStatus, cancelTrip } from "@/features/trips/tripsThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface TripsState {
  items: Trip[];
  status: RequestStatus;
  error: string | null;

  currentTrip: Trip | null;
  currentTripStatus: RequestStatus;
  currentTripError: string | null;

  auditLog: TripAuditLogEntry[] | null;
  auditLogStatus: RequestStatus;

  advanceStatus: RequestStatus;
  advanceError: string | null;

  cancelStatus: RequestStatus;
  cancelError: string | null;
}

const initialState: TripsState = {
  items: [],
  status: "idle",
  error: null,
  currentTrip: null,
  currentTripStatus: "idle",
  currentTripError: null,
  auditLog: null,
  auditLogStatus: "idle",
  advanceStatus: "idle",
  advanceError: null,
  cancelStatus: "idle",
  cancelError: null,
};

const tripsSlice = createSlice({
  name: "trips",
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
      .addCase(fetchTrips.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load trips";
      })

      .addCase(fetchTripById.pending, (state) => {
        state.currentTripStatus = "loading";
        state.currentTripError = null;
      })
      .addCase(fetchTripById.fulfilled, (state, action) => {
        state.currentTripStatus = "succeeded";
        state.currentTrip = action.payload;
      })
      .addCase(fetchTripById.rejected, (state, action) => {
        state.currentTripStatus = "failed";
        state.currentTripError = action.payload ?? "Failed to load trip";
      })

      .addCase(fetchTripAuditLog.pending, (state) => {
        state.auditLogStatus = "loading";
      })
      .addCase(fetchTripAuditLog.fulfilled, (state, action) => {
        state.auditLogStatus = "succeeded";
        state.auditLog = action.payload;
      })
      .addCase(fetchTripAuditLog.rejected, (state) => {
        state.auditLogStatus = "failed";
        state.auditLog = [];
      })

      .addCase(advanceTripStatus.pending, (state) => {
        state.advanceStatus = "loading";
        state.advanceError = null;
      })
      .addCase(advanceTripStatus.fulfilled, (state) => {
        state.advanceStatus = "succeeded";
      })
      .addCase(advanceTripStatus.rejected, (state, action) => {
        state.advanceStatus = "failed";
        state.advanceError = action.payload ?? "Failed to advance status";
      })

      .addCase(cancelTrip.pending, (state) => {
        state.cancelStatus = "loading";
        state.cancelError = null;
      })
      .addCase(cancelTrip.fulfilled, (state) => {
        state.cancelStatus = "succeeded";
      })
      .addCase(cancelTrip.rejected, (state, action) => {
        state.cancelStatus = "failed";
        state.cancelError = action.payload ?? "Failed to cancel trip";
      });
  },
});

export const { resetAdvanceStatus, resetCancelStatus } = tripsSlice.actions;
export default tripsSlice.reducer;
