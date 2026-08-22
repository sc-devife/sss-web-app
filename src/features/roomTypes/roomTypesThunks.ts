import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { RoomType, RoomTypePayload, UpdateRoomTypePayload } from "@/features/roomTypes/types";

export const fetchRoomTypes = createAsyncThunk<RoomType[], void, { rejectValue: string }>(
  "roomTypes/fetchRoomTypes",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<RoomType[]>("/library/room-types");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load room types"));
    }
  },
);

export const createRoomType = createAsyncThunk<void, RoomTypePayload, { rejectValue: string }>(
  "roomTypes/createRoomType",
  async (payload, { rejectWithValue }) => {
    try {
      await clientApi.post("/library/room-types", payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save room type"));
    }
  },
);

export const updateRoomType = createAsyncThunk<void, UpdateRoomTypePayload, { rejectValue: string }>(
  "roomTypes/updateRoomType",
  async ({ uid, payload }, { rejectWithValue }) => {
    try {
      await clientApi.put(`/library/room-types/${uid}`, payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save room type"));
    }
  },
);

export const deleteRoomType = createAsyncThunk<void, string, { rejectValue: string }>(
  "roomTypes/deleteRoomType",
  async (uid, { rejectWithValue }) => {
    try {
      await clientApi.delete(`/library/room-types/${uid}`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to delete room type"));
    }
  },
);
