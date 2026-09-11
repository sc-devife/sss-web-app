import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type {
  AuditLogEntry,
  CreateLeadPayload,
  UpdateLeadPayload,
  LeadReasonActionPayload,
  SetLeadFollowUpDueDatePayload,
  ConvertLeadToEscapePayload,
  ConvertLeadToEscapeResult,
  FetchLeadsParams,
  LeadsPage,
} from "@/features/leads/types";

// Every thunk uses an explicit try/catch + rejectWithValue, rather than
// letting createAsyncThunk auto-catch a thrown axios error, so the rejected
// action always carries a plain string message (extractErrorMessage) instead
// of axios's own AxiosError shape — matching the `body?.message ?? fallback`
// convention every fetch()-based call site used before this migration.

// Search + Status + Month/Week/Day/All + pagination — every param is
// forwarded straight through to GET /leads, which applies all of them as one
// DB-level query and returns exactly one page (Page<Lead>), never the full
// list. Omit an arg (or call with no argument at all) to get the backend's
// own defaults (no filters, page 0, 20/page, newest first).
export const fetchLeads = createAsyncThunk<LeadsPage, FetchLeadsParams | void, { rejectValue: string }>(
  "leads/fetchLeads",
  async (params, { rejectWithValue }) => {
    try {
      const search = new URLSearchParams();
      if (params?.search) search.set("search", params.search);
      if (params?.status) search.set("status", params.status);
      if (params?.priority) search.set("priority", "true");
      if (params?.from) search.set("from", params.from);
      if (params?.to) search.set("to", params.to);
      if (params?.escapePointId) search.set("escapePointId", params.escapePointId);
      if (params?.source) params.source.forEach((s) => search.append("source", s));
      // Always sent (defaults false) — the initial Leads page load must show
      // non-archived leads only, never rely on the backend's own default.
      search.set("archive", String(params?.archive ?? false));
      if (params?.page != null) search.set("page", String(params.page));
      if (params?.size != null) search.set("size", String(params.size));
      const qs = search.toString();
      const res = await clientApi.get<LeadsPage>(`/leads${qs ? `?${qs}` : ""}`);
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

export const updateLead = createAsyncThunk<void, UpdateLeadPayload, { rejectValue: string }>(
  "leads/updateLead",
  async ({ leadUid, ...payload }, { rejectWithValue }) => {
    try {
      await clientApi.put(`/leads/${leadUid}`, payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to update lead"));
    }
  },
);

export const contactLead = createAsyncThunk<void, string, { rejectValue: string }>(
  "leads/contactLead",
  async (leadUid, { rejectWithValue }) => {
    try {
      await clientApi.post(`/leads/${leadUid}/actions/contact`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Action failed"));
    }
  },
);

export const qualifyLead = createAsyncThunk<void, string, { rejectValue: string }>(
  "leads/qualifyLead",
  async (leadUid, { rejectWithValue }) => {
    try {
      await clientApi.post(`/leads/${leadUid}/actions/qualify`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Action failed"));
    }
  },
);

export const toggleLeadPriority = createAsyncThunk<void, string, { rejectValue: string }>(
  "leads/togglePriority",
  async (leadUid, { rejectWithValue }) => {
    try {
      await clientApi.post(`/leads/${leadUid}/actions/toggle-priority`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Action failed"));
    }
  },
);

export const archiveLead = createAsyncThunk<void, string, { rejectValue: string }>(
  "leads/archiveLead",
  async (leadUid, { rejectWithValue }) => {
    try {
      await clientApi.post(`/leads/${leadUid}/actions/archive`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to archive lead"));
    }
  },
);

export const applyLeadReasonAction = createAsyncThunk<void, LeadReasonActionPayload, { rejectValue: string }>(
  "leads/applyReasonAction",
  async ({ leadUid, action, reason }, { rejectWithValue }) => {
    try {
      await clientApi.post(`/leads/${leadUid}/actions/${action}`, { reason });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Action failed"));
    }
  },
);

export const setLeadFollowUpDueDate = createAsyncThunk<void, SetLeadFollowUpDueDatePayload, { rejectValue: string }>(
  "leads/setFollowUpDueDate",
  async ({ leadUid, followUpDueDate }, { rejectWithValue }) => {
    try {
      await clientApi.put(`/leads/${leadUid}/follow-up-due-date`, { followUpDueDate });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to update follow-up date"));
    }
  },
);

export const convertLeadToEscape = createAsyncThunk<ConvertLeadToEscapeResult, ConvertLeadToEscapePayload, { rejectValue: string }>(
  "leads/convertToEscape",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await clientApi.post<ConvertLeadToEscapeResult>(`/leads/${payload.leadUid}/actions/convert`, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to convert lead"));
    }
  },
);

export const fetchLeadAuditLog = createAsyncThunk<AuditLogEntry[], string, { rejectValue: string }>(
  "leads/fetchAuditLog",
  async (leadUid, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<AuditLogEntry[]>(`/leads/${leadUid}/audit-log`);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load history"));
    }
  },
);
