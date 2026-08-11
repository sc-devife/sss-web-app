import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type {
  ItineraryItem,
  CreateItineraryItemPayload,
  UpdateItineraryItemPayload,
  DeleteItineraryItemPayload,
  ReorderItineraryItemsPayload,
} from "@/features/itineraryItems/types";

// Fetch is keyed by itineraryUid in the slice — unlike most modules, more
// than one ItineraryCard can be expanded at once, so a flat single-array
// slice would let one card's items clobber another's.
export const fetchItineraryItems = createAsyncThunk<{ itineraryUid: string; items: ItineraryItem[] }, string, { rejectValue: string }>(
  "itineraryItems/fetchItineraryItems",
  async (itineraryUid, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<ItineraryItem[]>(`/itinerary-items?itineraryUid=${itineraryUid}`);
      return { itineraryUid, items: res.data };
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load itinerary items"));
    }
  },
);

export const createItineraryItem = createAsyncThunk<void, CreateItineraryItemPayload, { rejectValue: string }>(
  "itineraryItems/createItineraryItem",
  async (payload, { rejectWithValue }) => {
    try {
      await clientApi.post("/itinerary-items", payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to add item"));
    }
  },
);

export const updateItineraryItem = createAsyncThunk<void, UpdateItineraryItemPayload, { rejectValue: string }>(
  "itineraryItems/updateItineraryItem",
  async (payload, { rejectWithValue }) => {
    const { uid, dayNumber, itemType, referenceId, title, startTime, notes } = payload;
    try {
      await clientApi.put(`/itinerary-items/${uid}`, { dayNumber, itemType, referenceId, title, startTime, notes });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to update item"));
    }
  },
);

export const deleteItineraryItem = createAsyncThunk<void, DeleteItineraryItemPayload, { rejectValue: string }>(
  "itineraryItems/deleteItineraryItem",
  async ({ uid }, { rejectWithValue }) => {
    try {
      await clientApi.delete(`/itinerary-items/${uid}`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to remove item"));
    }
  },
);

export const reorderItineraryItems = createAsyncThunk<void, ReorderItineraryItemsPayload, { rejectValue: string }>(
  "itineraryItems/reorderItineraryItems",
  async ({ itineraryUid, orderedItemUids }, { rejectWithValue }) => {
    try {
      await clientApi.post("/itinerary-items/reorder", { itineraryUid, orderedItemUids });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to reorder items"));
    }
  },
);
