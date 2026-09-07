import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { EscapePoint, EscapePointPayload, UpdateEscapePointPayload, UpdateEscapePointLocationsPayload, SetEscapePointPriorityImagePayload } from "@/features/escapePoints/types";

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

// Returns the created EscapePoint (server-resolved uid) rather than void,
// unlike updateEscapePoint below — the form needs the new uid immediately
// afterward to attach its required Location via updateEscapePointLocations.
export const createEscapePoint = createAsyncThunk<EscapePoint, EscapePointPayload, { rejectValue: string }>(
  "escapePoints/createEscapePoint",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await clientApi.post<EscapePoint>("/library/escape-points", payload);
      return res.data;
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

export const updateEscapePointLocations = createAsyncThunk<void, UpdateEscapePointLocationsPayload, { rejectValue: string }>(
  "escapePoints/updateEscapePointLocations",
  async ({ uid, locationUids, primaryLocationUid }, { rejectWithValue }) => {
    try {
      await clientApi.put(`/library/escape-points/${uid}/locations`, { locationUids, primaryLocationUid });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to update locations"));
    }
  },
);

// Returns the updated EscapePoint (server-resolved) rather than void, unlike
// the other mutations here — the detail page applies it directly to local
// state for an immediate UI update instead of refetching the whole list.
export const setEscapePointPriorityImage = createAsyncThunk<EscapePoint, SetEscapePointPriorityImagePayload, { rejectValue: string }>(
  "escapePoints/setEscapePointPriorityImage",
  async ({ uid, imageUrl }, { rejectWithValue }) => {
    try {
      const res = await clientApi.put<EscapePoint>(`/library/escape-points/${uid}/priority-image`, { imageUrl });
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to set priority image"));
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
