import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { Itinerary, CreateItineraryPayload } from "@/features/itineraries/types";

export const fetchItinerariesForEscape = createAsyncThunk<Itinerary[], string, { rejectValue: string }>(
  "itineraries/fetchItinerariesForEscape",
  async (escapeUid, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<Itinerary[]>(`/itineraries?escapeUid=${escapeUid}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load itineraries"));
    }
  },
);

export const createItinerary = createAsyncThunk<void, CreateItineraryPayload, { rejectValue: string }>(
  "itineraries/createItinerary",
  async (payload, { rejectWithValue }) => {
    try {
      await clientApi.post("/itineraries", payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to create itinerary"));
    }
  },
);

export const deleteItinerary = createAsyncThunk<void, string, { rejectValue: string }>(
  "itineraries/deleteItinerary",
  async (uid, { rejectWithValue }) => {
    try {
      await clientApi.delete(`/itineraries/${uid}`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to delete itinerary"));
    }
  },
);

export const newItineraryVersion = createAsyncThunk<void, string, { rejectValue: string }>(
  "itineraries/newItineraryVersion",
  async (uid, { rejectWithValue }) => {
    try {
      await clientApi.post(`/itineraries/${uid}/new-version`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to create new version"));
    }
  },
);
