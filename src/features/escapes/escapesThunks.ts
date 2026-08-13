import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type {
  Escape,
  EscapeAuditLogEntry,
  AdvanceEscapePayload,
  CancelEscapePayload,
  AddEscapeTravellerPayload,
  UpdateTravellerPayload,
  DeleteTravellerPayload,
  UpdateEscapeDurationPayload,
} from "@/features/escapes/types";

export const fetchEscapes = createAsyncThunk<Escape[], void, { rejectValue: string }>(
  "escapes/fetchEscapes",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<Escape[]>("/escapes");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load escapes"));
    }
  },
);

export const fetchEscapeById = createAsyncThunk<Escape, string, { rejectValue: string }>(
  "escapes/fetchEscapeById",
  async (escapeUid, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<Escape>(`/escapes/${escapeUid}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load escape"));
    }
  },
);

export const fetchEscapeAuditLog = createAsyncThunk<EscapeAuditLogEntry[], string, { rejectValue: string }>(
  "escapes/fetchEscapeAuditLog",
  async (escapeUid, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<EscapeAuditLogEntry[]>(`/escapes/${escapeUid}/audit-log`);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load history"));
    }
  },
);

export const advanceEscapeStatus = createAsyncThunk<void, AdvanceEscapePayload, { rejectValue: string }>(
  "escapes/advanceEscapeStatus",
  async ({ escapeUid, targetStatus }, { rejectWithValue }) => {
    try {
      await clientApi.post(`/escapes/${escapeUid}/advance`, { targetStatus });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to advance status"));
    }
  },
);

export const cancelEscape = createAsyncThunk<void, CancelEscapePayload, { rejectValue: string }>(
  "escapes/cancelEscape",
  async ({ escapeUid, reason }, { rejectWithValue }) => {
    try {
      await clientApi.post(`/escapes/${escapeUid}/cancel`, { reason });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to cancel escape"));
    }
  },
);

export const addEscapeTraveller = createAsyncThunk<void, AddEscapeTravellerPayload, { rejectValue: string }>(
  "escapes/addEscapeTraveller",
  async ({ escapeUid, ...payload }, { rejectWithValue }) => {
    try {
      await clientApi.post(`/escapes/${escapeUid}/travellers`, payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to add traveller"));
    }
  },
);

export const updateTraveller = createAsyncThunk<void, UpdateTravellerPayload, { rejectValue: string }>(
  "escapes/updateTraveller",
  async ({ travellerUid, ...payload }, { rejectWithValue }) => {
    try {
      await clientApi.put(`/travellers/${travellerUid}`, payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to update traveller"));
    }
  },
);

export const deleteTraveller = createAsyncThunk<void, DeleteTravellerPayload, { rejectValue: string }>(
  "escapes/deleteTraveller",
  async ({ escapeUid, travellerUid }, { rejectWithValue }) => {
    try {
      await clientApi.delete(`/escapes/${escapeUid}/travellers/${travellerUid}`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to delete traveller"));
    }
  },
);

export const updateEscapeDuration = createAsyncThunk<void, UpdateEscapeDurationPayload, { rejectValue: string }>(
  "escapes/updateEscapeDuration",
  async ({ escapeUid, ...payload }, { rejectWithValue }) => {
    try {
      await clientApi.put(`/escapes/${escapeUid}`, payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to update escape duration"));
    }
  },
);
