import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type {
  InclusionExclusionItem,
  InclusionExclusionPayload,
  UpdateInclusionExclusionPayload,
  FetchSelectableArgs,
} from "@/features/inclusionExclusions/types";

export const fetchInclusionExclusions = createAsyncThunk<InclusionExclusionItem[], void, { rejectValue: string }>(
  "inclusionExclusions/fetchInclusionExclusions",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<InclusionExclusionItem[]>("/library/inclusion-exclusions");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load items"));
    }
  },
);

export const createInclusionExclusion = createAsyncThunk<void, InclusionExclusionPayload, { rejectValue: string }>(
  "inclusionExclusions/createInclusionExclusion",
  async (payload, { rejectWithValue }) => {
    try {
      await clientApi.post("/library/inclusion-exclusions", payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save"));
    }
  },
);

export const updateInclusionExclusion = createAsyncThunk<void, UpdateInclusionExclusionPayload, { rejectValue: string }>(
  "inclusionExclusions/updateInclusionExclusion",
  async ({ uid, payload }, { rejectWithValue }) => {
    try {
      await clientApi.put(`/library/inclusion-exclusions/${uid}`, payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save"));
    }
  },
);

// Used by ItineraryContentSection's "Add from library" picker — the library
// item excludes anything already attached to this itinerary+type. Keyed by
// `${itineraryUid}:${type}` in the slice since several TypeBlocks (across
// several expanded ItineraryCards) can have pickers open at once.
export const fetchSelectableInclusionExclusions = createAsyncThunk<
  { key: string; items: InclusionExclusionItem[] },
  FetchSelectableArgs,
  { rejectValue: string }
>(
  "inclusionExclusions/fetchSelectableInclusionExclusions",
  async ({ itineraryUid, type }, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<InclusionExclusionItem[]>(
        `/library/inclusion-exclusions/selectable?itineraryUid=${itineraryUid}&type=${type}`,
      );
      return { key: `${itineraryUid}:${type}`, items: res.data };
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load library items"));
    }
  },
);

export const deactivateInclusionExclusion = createAsyncThunk<void, string, { rejectValue: string }>(
  "inclusionExclusions/deactivateInclusionExclusion",
  async (uid, { rejectWithValue }) => {
    try {
      await clientApi.patch(`/library/inclusion-exclusions/${uid}/deactivate`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to deactivate"));
    }
  },
);
