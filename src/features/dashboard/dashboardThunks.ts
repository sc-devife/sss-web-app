import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { Dashboard } from "@/features/dashboard/types";
import type { RootState } from "@/store/store";

export const fetchDashboard = createAsyncThunk<Dashboard, void, { rejectValue: string; state: RootState }>(
  "dashboard/fetchDashboard",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<Dashboard>("/dashboard");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load dashboard"));
    }
  },
  {
    // Skips a redundant dispatch while one request is already in flight (or
    // has already succeeded) — e.g. DashboardPanel's mount effect firing
    // twice under React StrictMode's dev double-invoke, or two instances of
    // the panel mounting close together. Without this, each dispatch was a
    // full extra round trip to the backend.
    condition: (_arg, { getState }) => {
      const status = getState().dashboard.status;
      return status !== "loading" && status !== "succeeded";
    },
  },
);
