import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { Transport, TransportPayload, UpdateTransportPayload } from "@/features/transports/types";

export const fetchTransports = createAsyncThunk<Transport[], void, { rejectValue: string }>(
  "transports/fetchTransports",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<Transport[]>("/library/transports");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load transport"));
    }
  },
);

export const createTransport = createAsyncThunk<void, TransportPayload, { rejectValue: string }>(
  "transports/createTransport",
  async (payload, { rejectWithValue }) => {
    try {
      await clientApi.post("/library/transports", payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save transport"));
    }
  },
);

export const updateTransport = createAsyncThunk<void, UpdateTransportPayload, { rejectValue: string }>(
  "transports/updateTransport",
  async ({ uid, payload }, { rejectWithValue }) => {
    try {
      await clientApi.put(`/library/transports/${uid}`, payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save transport"));
    }
  },
);

export const deleteTransport = createAsyncThunk<void, string, { rejectValue: string }>(
  "transports/deleteTransport",
  async (uid, { rejectWithValue }) => {
    try {
      await clientApi.delete(`/library/transports/${uid}`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to archive transport"));
    }
  },
);
