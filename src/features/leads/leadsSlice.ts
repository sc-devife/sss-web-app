import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import type { Lead, AuditLogEntry } from "@/features/leads/types";
import {
  fetchLeads,
  createLead,
  updateLead,
  contactLead,
  qualifyLead,
  toggleLeadPriority,
  applyLeadReasonAction,
  setLeadFollowUpDueDate,
  convertLeadToEscape,
  fetchLeadAuditLog,
} from "@/features/leads/leadsThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface LeadsState {
  items: Lead[];
  // Pagination metadata from the last GET /leads response (all server-side —
  // see leadsThunks.fetchLeads/LeadController.getAllLeads).
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  status: RequestStatus;
  error: string | null;
  // The requestId of the most recently *dispatched* fetchLeads call. Every
  // filter change (search/status/period/page) dispatches a new fetchLeads
  // while an earlier one may still be in flight, so responses can resolve
  // out of order. fulfilled/rejected only apply their result when it matches
  // this — otherwise it's a stale response and is dropped.
  currentRequestId: string | null;

  createStatus: RequestStatus;
  createError: string | null;

  // Shared across contact/qualify/toggle-priority/disqualify/mark-lost/
  // mark-duplicate/assign — mirrors LeadDetailModal's single "busy"/"error"
  // state that covered every action button before this migration.
  actionStatus: RequestStatus;
  actionError: string | null;

  convertStatus: RequestStatus;
  convertError: string | null;

  auditLog: AuditLogEntry[] | null;
  auditLogStatus: RequestStatus;
}

const initialState: LeadsState = {
  items: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
  status: "idle",
  error: null,
  currentRequestId: null,
  createStatus: "idle",
  createError: null,
  actionStatus: "idle",
  actionError: null,
  convertStatus: "idle",
  convertError: null,
  auditLog: null,
  auditLogStatus: "idle",
};

const leadsSlice = createSlice({
  name: "leads",
  initialState,
  reducers: {
    resetCreateStatus(state) {
      state.createStatus = "idle";
      state.createError = null;
    },
    resetActionStatus(state) {
      state.actionStatus = "idle";
      state.actionError = null;
    },
    resetConvertStatus(state) {
      state.convertStatus = "idle";
      state.convertError = null;
    },
    clearAuditLog(state) {
      state.auditLog = null;
      state.auditLogStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state, action) => {
        // Always tracks the *latest* dispatch, even while an older one is
        // still in flight — that older one's fulfilled/rejected will see
        // this no longer matches its own requestId and drop its result.
        state.currentRequestId = action.meta.requestId;
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.currentRequestId) return;
        state.status = "succeeded";
        state.items = action.payload.content;
        state.page = action.payload.number;
        state.size = action.payload.size;
        state.totalElements = action.payload.totalElements;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        if (action.meta.requestId !== state.currentRequestId) return;
        state.status = "failed";
        state.error = action.payload ?? "Failed to load leads";
      })

      .addCase(createLead.pending, (state) => {
        state.createStatus = "loading";
        state.createError = null;
      })
      .addCase(createLead.fulfilled, (state) => {
        state.createStatus = "succeeded";
      })
      .addCase(createLead.rejected, (state, action) => {
        state.createStatus = "failed";
        state.createError = action.payload ?? "Failed to create lead";
      })

      // Shares createStatus/createError with createLead — the Add/Edit lead
      // modal is one shared form, never both in flight at once.
      .addCase(updateLead.pending, (state) => {
        state.createStatus = "loading";
        state.createError = null;
      })
      .addCase(updateLead.fulfilled, (state) => {
        state.createStatus = "succeeded";
      })
      .addCase(updateLead.rejected, (state, action) => {
        state.createStatus = "failed";
        state.createError = action.payload ?? "Failed to update lead";
      })

      .addCase(convertLeadToEscape.pending, (state) => {
        state.convertStatus = "loading";
        state.convertError = null;
      })
      .addCase(convertLeadToEscape.fulfilled, (state) => {
        state.convertStatus = "succeeded";
      })
      .addCase(convertLeadToEscape.rejected, (state, action) => {
        state.convertStatus = "failed";
        state.convertError = action.payload ?? "Failed to convert lead";
      })

      .addCase(fetchLeadAuditLog.pending, (state) => {
        state.auditLogStatus = "loading";
      })
      .addCase(fetchLeadAuditLog.fulfilled, (state, action) => {
        state.auditLogStatus = "succeeded";
        state.auditLog = action.payload;
      })
      .addCase(fetchLeadAuditLog.rejected, (state) => {
        state.auditLogStatus = "failed";
        state.auditLog = [];
      })

      .addMatcher(
        isAnyOf(contactLead.pending, qualifyLead.pending, toggleLeadPriority.pending, applyLeadReasonAction.pending, setLeadFollowUpDueDate.pending),
        (state) => {
          state.actionStatus = "loading";
          state.actionError = null;
        },
      )
      .addMatcher(
        isAnyOf(contactLead.fulfilled, qualifyLead.fulfilled, toggleLeadPriority.fulfilled, applyLeadReasonAction.fulfilled, setLeadFollowUpDueDate.fulfilled),
        (state) => {
          state.actionStatus = "succeeded";
        },
      )
      .addMatcher(
        isAnyOf(contactLead.rejected, qualifyLead.rejected, toggleLeadPriority.rejected, applyLeadReasonAction.rejected, setLeadFollowUpDueDate.rejected),
        (state, action) => {
          state.actionStatus = "failed";
          state.actionError = action.payload ?? "Action failed";
        },
      );
  },
});

export const { resetCreateStatus, resetActionStatus, resetConvertStatus, clearAuditLog } = leadsSlice.actions;
export default leadsSlice.reducer;
