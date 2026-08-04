import { createSlice } from "@reduxjs/toolkit";
import type { TaxProfile } from "@/features/taxProfiles/types";
import { fetchTaxProfiles, createTaxProfile, deactivateTaxProfile } from "@/features/taxProfiles/taxProfilesThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface TaxProfilesState {
  items: TaxProfile[];
  status: RequestStatus;
  error: string | null;

  saveStatus: RequestStatus;
  saveError: string | null;

  deactivateStatus: RequestStatus;
  deactivateError: string | null;
}

const initialState: TaxProfilesState = {
  items: [],
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
  deactivateStatus: "idle",
  deactivateError: null,
};

const taxProfilesSlice = createSlice({
  name: "taxProfiles",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTaxProfiles.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTaxProfiles.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchTaxProfiles.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load tax profiles";
      })

      .addCase(createTaxProfile.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(createTaxProfile.fulfilled, (state) => {
        state.saveStatus = "succeeded";
      })
      .addCase(createTaxProfile.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to add tax profile";
      })

      .addCase(deactivateTaxProfile.pending, (state) => {
        state.deactivateStatus = "loading";
        state.deactivateError = null;
      })
      .addCase(deactivateTaxProfile.fulfilled, (state) => {
        state.deactivateStatus = "succeeded";
      })
      .addCase(deactivateTaxProfile.rejected, (state, action) => {
        state.deactivateStatus = "failed";
        state.deactivateError = action.payload ?? "Failed to deactivate tax profile";
      });
  },
});

export const { resetSaveStatus } = taxProfilesSlice.actions;
export default taxProfilesSlice.reducer;
