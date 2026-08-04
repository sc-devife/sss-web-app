import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import type { ServiceProvider } from "@/features/serviceProviders/types";
import {
  fetchServiceProviders,
  createServiceProvider,
  updateServiceProvider,
  deleteServiceProvider,
} from "@/features/serviceProviders/serviceProvidersThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface ServiceProvidersState {
  items: ServiceProvider[];
  status: RequestStatus;
  error: string | null;

  saveStatus: RequestStatus;
  saveError: string | null;

  deleteStatus: RequestStatus;
  deleteError: string | null;
}

const initialState: ServiceProvidersState = {
  items: [],
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
  deleteStatus: "idle",
  deleteError: null,
};

const serviceProvidersSlice = createSlice({
  name: "serviceProviders",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServiceProviders.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchServiceProviders.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchServiceProviders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load service providers";
      })

      .addCase(deleteServiceProvider.pending, (state) => {
        state.deleteStatus = "loading";
        state.deleteError = null;
      })
      .addCase(deleteServiceProvider.fulfilled, (state) => {
        state.deleteStatus = "succeeded";
      })
      .addCase(deleteServiceProvider.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload ?? "Failed to archive service provider";
      })

      .addMatcher(isAnyOf(createServiceProvider.pending, updateServiceProvider.pending), (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addMatcher(isAnyOf(createServiceProvider.fulfilled, updateServiceProvider.fulfilled), (state) => {
        state.saveStatus = "succeeded";
      })
      .addMatcher(isAnyOf(createServiceProvider.rejected, updateServiceProvider.rejected), (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to save service provider";
      });
  },
});

export const { resetSaveStatus } = serviceProvidersSlice.actions;
export default serviceProvidersSlice.reducer;
