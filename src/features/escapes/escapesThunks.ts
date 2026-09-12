import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type {
  Escape,
  EscapeAuditLogEntry,
  AdvanceEscapePayload,
  CancelEscapePayload,
  HoldEscapePayload,
  AddEscapeTravellerPayload,
  UpdateTravellerPayload,
  DeleteTravellerPayload,
  UpdateEscapeDurationPayload,
  UpdateEscapeSummaryNotesPayload,
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

// Idempotent server-side — same call sets Hold the first time and just
// updates holdDate on later calls.
export const holdEscape = createAsyncThunk<void, HoldEscapePayload, { rejectValue: string }>(
  "escapes/holdEscape",
  async ({ escapeUid, holdDate }, { rejectWithValue }) => {
    try {
      await clientApi.post(`/escapes/${escapeUid}/hold`, { holdDate });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to update hold date"));
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

export const updateEscapeSummaryNotes = createAsyncThunk<void, UpdateEscapeSummaryNotesPayload, { rejectValue: string }>(
  "escapes/updateEscapeSummaryNotes",
  async ({ escapeUid, ...payload }, { rejectWithValue }) => {
    try {
      await clientApi.put(`/escapes/${escapeUid}/summary-notes`, payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save summary notes"));
    }
  },
);
