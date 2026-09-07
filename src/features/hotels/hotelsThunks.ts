import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { Hotel, HotelPayload, UpdateHotelPayload, SetHotelPriorityImagePayload } from "@/features/hotels/types";

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

// Returns the updated Hotel (server-resolved) rather than void, unlike the
// other mutations here — the detail page applies it directly to local state
// for an immediate UI update instead of refetching the whole list.
export const setHotelPriorityImage = createAsyncThunk<Hotel, SetHotelPriorityImagePayload, { rejectValue: string }>(
  "hotels/setHotelPriorityImage",
  async ({ uid, imageUrl }, { rejectWithValue }) => {
    try {
      const res = await clientApi.put<Hotel>(`/library/hotels/${uid}/priority-image`, { imageUrl });
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to set priority image"));
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
