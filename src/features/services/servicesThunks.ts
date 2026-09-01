import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { Service, ServicePayload, UpdateServicePayload } from "@/features/services/types";

export const fetchServices = createAsyncThunk<Service[], void, { rejectValue: string }>(
  "services/fetchServices",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<Service[]>("/library/services");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load services"));
    }
  },
);

export const createService = createAsyncThunk<void, ServicePayload, { rejectValue: string }>(
  "services/createService",
  async (payload, { rejectWithValue }) => {
    try {
      await clientApi.post("/library/services", payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save service"));
    }
  },
);

export const updateService = createAsyncThunk<void, UpdateServicePayload, { rejectValue: string }>(
  "services/updateService",
  async ({ uid, payload }, { rejectWithValue }) => {
    try {
      await clientApi.put(`/library/services/${uid}`, payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save service"));
    }
  },
);

export const deleteService = createAsyncThunk<void, string, { rejectValue: string }>(
  "services/deleteService",
  async (uid, { rejectWithValue }) => {
    try {
      await clientApi.delete(`/library/services/${uid}`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to delete service"));
    }
  },
);
