import type { RootState } from "@/store/store";

export const selectFollowUps = (state: RootState) => state.followups.items;
export const selectFollowUpsStatus = (state: RootState) => state.followups.status;
export const selectFollowUpsError = (state: RootState) => state.followups.error;
export const selectFollowUpsPage = (state: RootState) => state.followups.page;
export const selectFollowUpsTotalPages = (state: RootState) => state.followups.totalPages;

export const selectFollowUpCount = (state: RootState) => state.followups.count;

export const selectLeadFollowUps = (state: RootState) => state.followups.leadFollowUps;
export const selectLeadFollowUpsStatus = (state: RootState) => state.followups.leadFollowUpsStatus;

export const selectEscapeFollowUps = (state: RootState) => state.followups.escapeFollowUps;
export const selectEscapeFollowUpsStatus = (state: RootState) => state.followups.escapeFollowUpsStatus;

export const selectCreateFollowUpStatus = (state: RootState) => state.followups.createStatus;
export const selectCreateFollowUpError = (state: RootState) => state.followups.createError;
