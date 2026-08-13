import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { Itinerary, CreateItineraryPayload, UpdateItineraryPayload } from "@/features/itineraries/types";

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

export const updateItinerary = createAsyncThunk<Itinerary, UpdateItineraryPayload, { rejectValue: string }>(
  "itineraries/updateItinerary",
  async ({ uid, name }, { rejectWithValue }) => {
    try {
      const res = await clientApi.put<Itinerary>(`/itineraries/${uid}`, { name });
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to rename itinerary"));
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

export const duplicateItinerary = createAsyncThunk<void, string, { rejectValue: string }>(
  "itineraries/duplicateItinerary",
  async (uid, { rejectWithValue }) => {
    try {
      await clientApi.post(`/itineraries/${uid}/duplicate`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to duplicate itinerary"));
    }
  },
);
