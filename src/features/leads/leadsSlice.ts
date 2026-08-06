import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import type { Lead, AuditLogEntry } from "@/features/leads/types";
import {
  fetchLeads,
  createLead,
  contactLead,
  qualifyLead,
  toggleLeadPriority,
  applyLeadReasonAction,
  assignLead,
  convertLeadToEscape,
  fetchLeadAuditLog,
} from "@/features/leads/leadsThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface LeadsState {
  items: Lead[];
  status: RequestStatus;
  error: string | null;

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
  status: "idle",
  error: null,
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
      .addCase(fetchLeads.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
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
        isAnyOf(contactLead.pending, qualifyLead.pending, toggleLeadPriority.pending, applyLeadReasonAction.pending, assignLead.pending),
        (state) => {
          state.actionStatus = "loading";
          state.actionError = null;
        },
      )
      .addMatcher(
        isAnyOf(contactLead.fulfilled, qualifyLead.fulfilled, toggleLeadPriority.fulfilled, applyLeadReasonAction.fulfilled, assignLead.fulfilled),
        (state) => {
          state.actionStatus = "succeeded";
        },
      )
      .addMatcher(
        isAnyOf(contactLead.rejected, qualifyLead.rejected, toggleLeadPriority.rejected, applyLeadReasonAction.rejected, assignLead.rejected),
        (state, action) => {
          state.actionStatus = "failed";
          state.actionError = action.payload ?? "Action failed";
        },
      );
  },
});

export const { resetCreateStatus, resetActionStatus, resetConvertStatus, clearAuditLog } = leadsSlice.actions;
export default leadsSlice.reducer;
