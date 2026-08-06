import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { EscapePoint, EscapePointPayload, UpdateEscapePointPayload } from "@/features/escapePoints/types";

// GET here returns EscapePoint[] already enriched with locationLabel by the
// route handler (see api/library/escape-points/route.ts) — the resolver
// itself is "server-only" and can't run inside this client-dispatched thunk.
export const fetchEscapePoints = createAsyncThunk<EscapePoint[], void, { rejectValue: string }>(
  "escapePoints/fetchEscapePoints",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<EscapePoint[]>("/library/escape-points");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load escape points"));
    }
  },
);

export const createEscapePoint = createAsyncThunk<void, EscapePointPayload, { rejectValue: string }>(
  "escapePoints/createEscapePoint",
  async (payload, { rejectWithValue }) => {
    try {
      await clientApi.post("/library/escape-points", payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save escape point"));
    }
  },
);

export const updateEscapePoint = createAsyncThunk<void, UpdateEscapePointPayload, { rejectValue: string }>(
  "escapePoints/updateEscapePoint",
  async ({ uid, payload }, { rejectWithValue }) => {
    try {
      await clientApi.put(`/library/escape-points/${uid}`, payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save escape point"));
    }
  },
);

export const deleteEscapePoint = createAsyncThunk<void, string, { rejectValue: string }>(
  "escapePoints/deleteEscapePoint",
  async (uid, { rejectWithValue }) => {
    try {
      await clientApi.delete(`/library/escape-points/${uid}`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to archive escape point"));
    }
  },
);
