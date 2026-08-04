import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type {
  Lead,
  AuditLogEntry,
  CreateLeadPayload,
  LeadReasonActionPayload,
  AssignLeadPayload,
  ConvertLeadToTripPayload,
  ConvertLeadToTripResult,
} from "@/features/leads/types";

// Every thunk uses an explicit try/catch + rejectWithValue, rather than
// letting createAsyncThunk auto-catch a thrown axios error, so the rejected
// action always carries a plain string message (extractErrorMessage) instead
// of axios's own AxiosError shape — matching the `body?.message ?? fallback`
// convention every fetch()-based call site used before this migration.

export const fetchLeads = createAsyncThunk<Lead[], void, { rejectValue: string }>(
  "leads/fetchLeads",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<Lead[]>("/leads");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load leads"));
    }
  },
);

// Mutation thunks intentionally resolve to void rather than the updated Lead:
// the pre-Redux code never consumed the action endpoints' response bodies
// either — it just called router.refresh() to reload everything from the
// server. Callers dispatch fetchLeads() again after a successful mutation to
// reproduce that same "always resync with backend truth" behavior.

export const createLead = createAsyncThunk<void, CreateLeadPayload, { rejectValue: string }>(
  "leads/createLead",
  async (payload, { rejectWithValue }) => {
    try {
      await clientApi.post("/leads", payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to create lead"));
    }
  },
);

export const contactLead = createAsyncThunk<void, number, { rejectValue: string }>(
  "leads/contactLead",
  async (leadId, { rejectWithValue }) => {
    try {
      await clientApi.post(`/leads/${leadId}/actions/contact`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Action failed"));
    }
  },
);

export const qualifyLead = createAsyncThunk<void, number, { rejectValue: string }>(
  "leads/qualifyLead",
  async (leadId, { rejectWithValue }) => {
    try {
      await clientApi.post(`/leads/${leadId}/actions/qualify`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Action failed"));
    }
  },
);

export const toggleLeadPriority = createAsyncThunk<void, number, { rejectValue: string }>(
  "leads/togglePriority",
  async (leadId, { rejectWithValue }) => {
    try {
      await clientApi.post(`/leads/${leadId}/actions/toggle-priority`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Action failed"));
    }
  },
);

export const applyLeadReasonAction = createAsyncThunk<void, LeadReasonActionPayload, { rejectValue: string }>(
  "leads/applyReasonAction",
  async ({ leadId, action, reason }, { rejectWithValue }) => {
    try {
      await clientApi.post(`/leads/${leadId}/actions/${action}`, { reason });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Action failed"));
    }
  },
);

export const assignLead = createAsyncThunk<void, AssignLeadPayload, { rejectValue: string }>(
  "leads/assignLead",
  async ({ leadId, userId, reason }, { rejectWithValue }) => {
    try {
      await clientApi.post(`/leads/${leadId}/assign`, { userId, reason: reason || undefined });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Action failed"));
    }
  },
);

export const convertLeadToTrip = createAsyncThunk<ConvertLeadToTripResult, ConvertLeadToTripPayload, { rejectValue: string }>(
  "leads/convertToTrip",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await clientApi.post<ConvertLeadToTripResult>(`/leads/${payload.leadId}/actions/convert`, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to convert lead"));
    }
  },
);

export const fetchLeadAuditLog = createAsyncThunk<AuditLogEntry[], number, { rejectValue: string }>(
  "leads/fetchAuditLog",
  async (leadId, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<AuditLogEntry[]>(`/leads/${leadId}/audit-log`);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load history"));
    }
  },
);
