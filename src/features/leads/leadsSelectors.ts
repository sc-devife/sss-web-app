import type { RootState } from "@/store/store";

export const selectLeads = (state: RootState) => state.leads.items;
export const selectLeadsStatus = (state: RootState) => state.leads.status;
export const selectLeadsError = (state: RootState) => state.leads.error;

export const selectCreateLeadStatus = (state: RootState) => state.leads.createStatus;
export const selectCreateLeadError = (state: RootState) => state.leads.createError;

export const selectLeadActionStatus = (state: RootState) => state.leads.actionStatus;
export const selectLeadActionError = (state: RootState) => state.leads.actionError;

export const selectConvertStatus = (state: RootState) => state.leads.convertStatus;
export const selectConvertError = (state: RootState) => state.leads.convertError;

export const selectLeadAuditLog = (state: RootState) => state.leads.auditLog;
export const selectLeadAuditLogStatus = (state: RootState) => state.leads.auditLogStatus;
