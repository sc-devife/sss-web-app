import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { Dashboard } from "@/features/dashboard/types";

export const fetchDashboard = createAsyncThunk<Dashboard, void, { rejectValue: string }>(
  "dashboard/fetchDashboard",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<Dashboard>("/dashboard");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load dashboard"));
    }
  },
);
