import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import type { Service } from "@/features/services/types";
import { fetchServices, createService, updateService, deleteService } from "@/features/services/servicesThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface ServicesState {
  items: Service[];
  status: RequestStatus;
  error: string | null;

  saveStatus: RequestStatus;
  saveError: string | null;

  deleteStatus: RequestStatus;
  deleteError: string | null;
}

const initialState: ServicesState = {
  items: [],
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
  deleteStatus: "idle",
  deleteError: null,
};

const servicesSlice = createSlice({
  name: "services",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load services";
      })

      .addCase(deleteService.pending, (state) => {
        state.deleteStatus = "loading";
        state.deleteError = null;
      })
      .addCase(deleteService.fulfilled, (state) => {
        state.deleteStatus = "succeeded";
      })
      .addCase(deleteService.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload ?? "Failed to delete service";
      })

      .addMatcher(isAnyOf(createService.pending, updateService.pending), (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addMatcher(isAnyOf(createService.fulfilled, updateService.fulfilled), (state) => {
        state.saveStatus = "succeeded";
      })
      .addMatcher(isAnyOf(createService.rejected, updateService.rejected), (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to save service";
      });
  },
});

export const { resetSaveStatus } = servicesSlice.actions;
export default servicesSlice.reducer;
