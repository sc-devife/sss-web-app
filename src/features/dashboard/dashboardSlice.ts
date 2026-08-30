import { createSlice } from "@reduxjs/toolkit";
import type { Dashboard, LeadsTrendPeriod, LeadsTrendPoint } from "@/features/dashboard/types";
import { fetchDashboard, fetchLeadsTrend } from "@/features/dashboard/dashboardThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface DashboardState {
  data: Dashboard | null;
  status: RequestStatus;
  error: string | null;
  leadsTrend: LeadsTrendPoint[];
  leadsTrendPeriod: LeadsTrendPeriod;
  leadsTrendStatus: RequestStatus;
  leadsTrendError: string | null;
}

const initialState: DashboardState = {
  data: null,
  status: "idle",
  error: null,
  leadsTrend: [],
  leadsTrendPeriod: "30d",
  leadsTrendStatus: "idle",
  leadsTrendError: null,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load dashboard";
      })
      .addCase(fetchLeadsTrend.pending, (state, action) => {
        state.leadsTrendStatus = "loading";
        state.leadsTrendError = null;
        state.leadsTrendPeriod = action.meta.arg;
      })
      .addCase(fetchLeadsTrend.fulfilled, (state, action) => {
        state.leadsTrendStatus = "succeeded";
        state.leadsTrend = action.payload;
      })
      .addCase(fetchLeadsTrend.rejected, (state, action) => {
        state.leadsTrendStatus = "failed";
        state.leadsTrendError = action.payload ?? "Failed to load leads trend";
      });
  },
});

export default dashboardSlice.reducer;
