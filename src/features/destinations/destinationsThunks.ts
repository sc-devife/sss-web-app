import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { Destination, DestinationPayload, UpdateDestinationPayload } from "@/features/destinations/types";

// GET here returns Destination[] already enriched with locationLabel by the
// route handler (see api/library/destinations/route.ts) — the resolver
// itself is "server-only" and can't run inside this client-dispatched thunk.
export const fetchDestinations = createAsyncThunk<Destination[], void, { rejectValue: string }>(
  "destinations/fetchDestinations",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<Destination[]>("/library/destinations");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load destinations"));
    }
  },
);

export const createDestination = createAsyncThunk<void, DestinationPayload, { rejectValue: string }>(
  "destinations/createDestination",
  async (payload, { rejectWithValue }) => {
    try {
      await clientApi.post("/library/destinations", payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save destination"));
    }
  },
);

export const updateDestination = createAsyncThunk<void, UpdateDestinationPayload, { rejectValue: string }>(
  "destinations/updateDestination",
  async ({ uid, payload }, { rejectWithValue }) => {
    try {
      await clientApi.put(`/library/destinations/${uid}`, payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save destination"));
    }
  },
);

export const deleteDestination = createAsyncThunk<void, string, { rejectValue: string }>(
  "destinations/deleteDestination",
  async (uid, { rejectWithValue }) => {
    try {
      await clientApi.delete(`/library/destinations/${uid}`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to archive destination"));
    }
  },
);
