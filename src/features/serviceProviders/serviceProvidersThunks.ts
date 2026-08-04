import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { ServiceProvider, ServiceProviderPayload, UpdateServiceProviderPayload } from "@/features/serviceProviders/types";

// GET here returns ServiceProvider[] already enriched with countryLabel by
// the route handler (see api/library/service-providers/route.ts) — the
// resolver itself is "server-only" and can't run inside this thunk.
export const fetchServiceProviders = createAsyncThunk<ServiceProvider[], void, { rejectValue: string }>(
  "serviceProviders/fetchServiceProviders",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<ServiceProvider[]>("/library/service-providers");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load service providers"));
    }
  },
);

export const createServiceProvider = createAsyncThunk<void, ServiceProviderPayload, { rejectValue: string }>(
  "serviceProviders/createServiceProvider",
  async (payload, { rejectWithValue }) => {
    try {
      await clientApi.post("/library/service-providers", payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save service provider"));
    }
  },
);

export const updateServiceProvider = createAsyncThunk<void, UpdateServiceProviderPayload, { rejectValue: string }>(
  "serviceProviders/updateServiceProvider",
  async ({ uid, payload }, { rejectWithValue }) => {
    try {
      await clientApi.put(`/library/service-providers/${uid}`, payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save service provider"));
    }
  },
);

export const deleteServiceProvider = createAsyncThunk<void, string, { rejectValue: string }>(
  "serviceProviders/deleteServiceProvider",
  async (uid, { rejectWithValue }) => {
    try {
      await clientApi.delete(`/library/service-providers/${uid}`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to archive service provider"));
    }
  },
);
