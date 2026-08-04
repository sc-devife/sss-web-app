import type { RootState } from "@/store/store";

export const selectTrips = (state: RootState) => state.trips.items;
export const selectTripsStatus = (state: RootState) => state.trips.status;
export const selectTripsError = (state: RootState) => state.trips.error;

export const selectCurrentTrip = (state: RootState) => state.trips.currentTrip;
export const selectCurrentTripStatus = (state: RootState) => state.trips.currentTripStatus;
export const selectCurrentTripError = (state: RootState) => state.trips.currentTripError;

export const selectTripAuditLog = (state: RootState) => state.trips.auditLog;
export const selectTripAuditLogStatus = (state: RootState) => state.trips.auditLogStatus;

export const selectAdvanceStatus = (state: RootState) => state.trips.advanceStatus;
export const selectAdvanceError = (state: RootState) => state.trips.advanceError;

export const selectCancelStatus = (state: RootState) => state.trips.cancelStatus;
export const selectCancelError = (state: RootState) => state.trips.cancelError;
