import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import type { Transport } from "@/features/transports/types";
import { fetchTransports, createTransport, updateTransport, deleteTransport } from "@/features/transports/transportsThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface TransportsState {
  items: Transport[];
  status: RequestStatus;
  error: string | null;

  saveStatus: RequestStatus;
  saveError: string | null;

  deleteStatus: RequestStatus;
  deleteError: string | null;
}

const initialState: TransportsState = {
  items: [],
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
  deleteStatus: "idle",
  deleteError: null,
};

const transportsSlice = createSlice({
  name: "transports",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransports.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTransports.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchTransports.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load transport";
      })

      .addCase(deleteTransport.pending, (state) => {
        state.deleteStatus = "loading";
        state.deleteError = null;
      })
      .addCase(deleteTransport.fulfilled, (state) => {
        state.deleteStatus = "succeeded";
      })
      .addCase(deleteTransport.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload ?? "Failed to archive transport";
      })

      .addMatcher(isAnyOf(createTransport.pending, updateTransport.pending), (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addMatcher(isAnyOf(createTransport.fulfilled, updateTransport.fulfilled), (state) => {
        state.saveStatus = "succeeded";
      })
      .addMatcher(isAnyOf(createTransport.rejected, updateTransport.rejected), (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to save transport";
      });
  },
});

export const { resetSaveStatus } = transportsSlice.actions;
export default transportsSlice.reducer;
