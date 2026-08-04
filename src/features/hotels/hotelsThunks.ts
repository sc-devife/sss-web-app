import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { Hotel, HotelPayload, UpdateHotelPayload } from "@/features/hotels/types";

export const fetchHotels = createAsyncThunk<Hotel[], void, { rejectValue: string }>(
  "hotels/fetchHotels",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<Hotel[]>("/library/hotels");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load hotels"));
    }
  },
);

// Mutation thunks resolve to void — components re-dispatch fetchHotels() on
// success to resync, matching the pre-migration router.refresh() behavior.

export const createHotel = createAsyncThunk<void, HotelPayload, { rejectValue: string }>(
  "hotels/createHotel",
  async (payload, { rejectWithValue }) => {
    try {
      await clientApi.post("/library/hotels", payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save hotel"));
    }
  },
);

export const updateHotel = createAsyncThunk<void, UpdateHotelPayload, { rejectValue: string }>(
  "hotels/updateHotel",
  async ({ uid, payload }, { rejectWithValue }) => {
    try {
      await clientApi.put(`/library/hotels/${uid}`, payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save hotel"));
    }
  },
);

export const deleteHotel = createAsyncThunk<void, string, { rejectValue: string }>(
  "hotels/deleteHotel",
  async (uid, { rejectWithValue }) => {
    try {
      await clientApi.delete(`/library/hotels/${uid}`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to archive hotel"));
    }
  },
);
