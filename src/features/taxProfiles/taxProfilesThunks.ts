import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { TaxProfile, TaxProfilePayload } from "@/features/taxProfiles/types";

export const fetchTaxProfiles = createAsyncThunk<TaxProfile[], void, { rejectValue: string }>(
  "taxProfiles/fetchTaxProfiles",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<TaxProfile[]>("/tax-profiles");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load tax profiles"));
    }
  },
);

export const createTaxProfile = createAsyncThunk<void, TaxProfilePayload, { rejectValue: string }>(
  "taxProfiles/createTaxProfile",
  async (payload, { rejectWithValue }) => {
    try {
      await clientApi.post("/tax-profiles", payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to add tax profile"));
    }
  },
);

export const deactivateTaxProfile = createAsyncThunk<void, string, { rejectValue: string }>(
  "taxProfiles/deactivateTaxProfile",
  async (uid, { rejectWithValue }) => {
    try {
      await clientApi.post(`/tax-profiles/${uid}/deactivate`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to deactivate tax profile"));
    }
  },
);
