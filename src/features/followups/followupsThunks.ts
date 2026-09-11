import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type {
  FollowUp,
  FollowUpsPage,
  FetchFollowUpsParams,
  CreateFollowUpPayload,
  UpdateFollowUpPayload,
  UpdateFollowUpStatusPayload,
} from "@/features/followups/types";

// Mirrors leadsThunks.ts exactly: explicit try/catch + rejectWithValue so a
// rejected action always carries a plain string message.

export const fetchFollowUps = createAsyncThunk<FollowUpsPage, FetchFollowUpsParams | void, { rejectValue: string }>(
  "followups/fetchFollowUps",
  async (params, { rejectWithValue }) => {
    try {
      const search = new URLSearchParams();
      if (params?.filter) search.set("filter", params.filter);
      if (params?.search) search.set("search", params.search);
      if (params?.page != null) search.set("page", String(params.page));
      if (params?.size != null) search.set("size", String(params.size));
      const qs = search.toString();
      const res = await clientApi.get<FollowUpsPage>(`/follow-ups${qs ? `?${qs}` : ""}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load follow-ups"));
    }
  },
);

export const fetchFollowUpCount = createAsyncThunk<number, void, { rejectValue: string }>(
  "followups/fetchFollowUpCount",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<{ count: number }>("/follow-ups/count");
      return res.data.count;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load follow-up count"));
    }
  },
);

export const fetchFollowUpsForLead = createAsyncThunk<FollowUp[], string, { rejectValue: string }>(
  "followups/fetchFollowUpsForLead",
  async (leadUid, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<FollowUp[]>(`/follow-ups/by-lead/${leadUid}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load follow-ups"));
    }
  },
);

export const fetchFollowUpsForEscape = createAsyncThunk<FollowUp[], string, { rejectValue: string }>(
  "followups/fetchFollowUpsForEscape",
  async (escapeUid, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<FollowUp[]>(`/follow-ups/by-escape/${escapeUid}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load follow-ups"));
    }
  },
);

export const createFollowUp = createAsyncThunk<FollowUp, CreateFollowUpPayload, { rejectValue: string }>(
  "followups/createFollowUp",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await clientApi.post<FollowUp>("/follow-ups/create", payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to create follow-up"));
    }
  },
);

export const updateFollowUp = createAsyncThunk<FollowUp, UpdateFollowUpPayload, { rejectValue: string }>(
  "followups/updateFollowUp",
  async ({ followUpUid, ...payload }, { rejectWithValue }) => {
    try {
      const res = await clientApi.put<FollowUp>(`/follow-ups/${followUpUid}`, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to update follow-up"));
    }
  },
);

export const updateFollowUpStatus = createAsyncThunk<FollowUp, UpdateFollowUpStatusPayload, { rejectValue: string }>(
  "followups/updateFollowUpStatus",
  async ({ followUpUid, status }, { rejectWithValue }) => {
    try {
      const res = await clientApi.patch<FollowUp>(`/follow-ups/${followUpUid}/status`, { status });
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to update status"));
    }
  },
);
