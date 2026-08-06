import type { RootState } from "@/store/store";

export const selectEscapes = (state: RootState) => state.escapes.items;
export const selectEscapesStatus = (state: RootState) => state.escapes.status;
export const selectEscapesError = (state: RootState) => state.escapes.error;

export const selectCurrentEscape = (state: RootState) => state.escapes.currentEscape;
export const selectCurrentEscapeStatus = (state: RootState) => state.escapes.currentEscapeStatus;
export const selectCurrentEscapeError = (state: RootState) => state.escapes.currentEscapeError;

export const selectEscapeAuditLog = (state: RootState) => state.escapes.auditLog;
export const selectEscapeAuditLogStatus = (state: RootState) => state.escapes.auditLogStatus;

export const selectAdvanceStatus = (state: RootState) => state.escapes.advanceStatus;
export const selectAdvanceError = (state: RootState) => state.escapes.advanceError;

export const selectCancelStatus = (state: RootState) => state.escapes.cancelStatus;
export const selectCancelError = (state: RootState) => state.escapes.cancelError;
