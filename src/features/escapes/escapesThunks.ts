import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { Escape, EscapeAuditLogEntry, AdvanceEscapePayload, CancelEscapePayload } from "@/features/escapes/types";

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
