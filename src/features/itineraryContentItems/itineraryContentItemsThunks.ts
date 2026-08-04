import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type {
  ItineraryContentItem,
  AttachItineraryContentItemPayload,
  CreateItineraryContentItemPayload,
  UpdateItineraryContentItemPayload,
  DeleteItineraryContentItemPayload,
} from "@/features/itineraryContentItems/types";

export const fetchItineraryContentItems = createAsyncThunk<
  { itineraryUid: string; items: ItineraryContentItem[] },
  string,
  { rejectValue: string }
>(
  "itineraryContentItems/fetchItineraryContentItems",
  async (itineraryUid, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<ItineraryContentItem[]>(`/itinerary-content-items?itineraryUid=${itineraryUid}`);
      return { itineraryUid, items: res.data };
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load content items"));
    }
  },
);

export const attachItineraryContentItem = createAsyncThunk<void, AttachItineraryContentItemPayload, { rejectValue: string }>(
  "itineraryContentItems/attachItineraryContentItem",
  async (payload, { rejectWithValue }) => {
    try {
      await clientApi.post("/itinerary-content-items/attach", payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to attach"));
    }
  },
);

export const createItineraryContentItem = createAsyncThunk<void, CreateItineraryContentItemPayload, { rejectValue: string }>(
  "itineraryContentItems/createItineraryContentItem",
  async (payload, { rejectWithValue }) => {
    try {
      await clientApi.post("/itinerary-content-items", payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to add"));
    }
  },
);

export const updateItineraryContentItem = createAsyncThunk<void, UpdateItineraryContentItemPayload, { rejectValue: string }>(
  "itineraryContentItems/updateItineraryContentItem",
  async ({ uid, name, contentHtml }, { rejectWithValue }) => {
    try {
      await clientApi.put(`/itinerary-content-items/${uid}`, { name, contentHtml });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save"));
    }
  },
);

export const deleteItineraryContentItem = createAsyncThunk<void, DeleteItineraryContentItemPayload, { rejectValue: string }>(
  "itineraryContentItems/deleteItineraryContentItem",
  async ({ uid }, { rejectWithValue }) => {
    try {
      await clientApi.delete(`/itinerary-content-items/${uid}`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to remove"));
    }
  },
);
