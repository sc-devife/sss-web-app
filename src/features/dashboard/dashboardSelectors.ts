import type { RootState } from "@/store/store";

export const selectDashboard = (state: RootState) => state.dashboard.data;
export const selectDashboardStatus = (state: RootState) => state.dashboard.status;
export const selectDashboardError = (state: RootState) => state.dashboard.error;

export const selectLeadsTrend = (state: RootState) => state.dashboard.leadsTrend;
export const selectLeadsTrendPeriod = (state: RootState) => state.dashboard.leadsTrendPeriod;
export const selectLeadsTrendStatus = (state: RootState) => state.dashboard.leadsTrendStatus;
export const selectLeadsTrendError = (state: RootState) => state.dashboard.leadsTrendError;
