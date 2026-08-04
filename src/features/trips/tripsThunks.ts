import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { Trip, TripAuditLogEntry, AdvanceTripPayload, CancelTripPayload } from "@/features/trips/types";

export const fetchTrips = createAsyncThunk<Trip[], void, { rejectValue: string }>(
  "trips/fetchTrips",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<Trip[]>("/trips");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load trips"));
    }
  },
);

export const fetchTripById = createAsyncThunk<Trip, number, { rejectValue: string }>(
  "trips/fetchTripById",
  async (tripId, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<Trip>(`/trips/${tripId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load trip"));
    }
  },
);

export const fetchTripAuditLog = createAsyncThunk<TripAuditLogEntry[], number, { rejectValue: string }>(
  "trips/fetchTripAuditLog",
  async (tripId, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<TripAuditLogEntry[]>(`/trips/${tripId}/audit-log`);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load history"));
    }
  },
);

export const advanceTripStatus = createAsyncThunk<void, AdvanceTripPayload, { rejectValue: string }>(
  "trips/advanceTripStatus",
  async ({ tripId, targetStatus }, { rejectWithValue }) => {
    try {
      await clientApi.post(`/trips/${tripId}/advance`, { targetStatus });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to advance status"));
    }
  },
);

export const cancelTrip = createAsyncThunk<void, CancelTripPayload, { rejectValue: string }>(
  "trips/cancelTrip",
  async ({ tripId, reason }, { rejectWithValue }) => {
    try {
      await clientApi.post(`/trips/${tripId}/cancel`, { reason });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to cancel trip"));
    }
  },
);
