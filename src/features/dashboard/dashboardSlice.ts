import { createSlice } from "@reduxjs/toolkit";
import type { Dashboard } from "@/features/dashboard/types";
import { fetchDashboard } from "@/features/dashboard/dashboardThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface DashboardState {
  data: Dashboard | null;
  status: RequestStatus;
  error: string | null;
}

const initialState: DashboardState = {
  data: null,
  status: "idle",
  error: null,
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
      });
  },
});

export default dashboardSlice.reducer;
