import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { Activity, ActivityPayload, UpdateActivityPayload } from "@/features/activities/types";

export const fetchActivities = createAsyncThunk<Activity[], void, { rejectValue: string }>(
  "activities/fetchActivities",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<Activity[]>("/library/activities");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load activities"));
    }
  },
);

export const createActivity = createAsyncThunk<void, ActivityPayload, { rejectValue: string }>(
  "activities/createActivity",
  async (payload, { rejectWithValue }) => {
    try {
      await clientApi.post("/library/activities", payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save activity"));
    }
  },
);

export const updateActivity = createAsyncThunk<void, UpdateActivityPayload, { rejectValue: string }>(
  "activities/updateActivity",
  async ({ uid, payload }, { rejectWithValue }) => {
    try {
      await clientApi.put(`/library/activities/${uid}`, payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save activity"));
    }
  },
);

export const deleteActivity = createAsyncThunk<void, string, { rejectValue: string }>(
  "activities/deleteActivity",
  async (uid, { rejectWithValue }) => {
    try {
      await clientApi.delete(`/library/activities/${uid}`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to archive activity"));
    }
  },
);
