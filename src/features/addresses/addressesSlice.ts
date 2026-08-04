import { createSlice } from "@reduxjs/toolkit";
import type { Address } from "@/features/addresses/types";
import {
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "@/features/addresses/addressesThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface AddressesState {
  items: Address[];
  status: RequestStatus;
  error: string | null;

  saveStatus: RequestStatus;
  saveError: string | null;

  updateStatus: RequestStatus;
  updateError: string | null;

  deleteStatus: RequestStatus;
  deleteError: string | null;
}

const initialState: AddressesState = {
  items: [],
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
  updateStatus: "idle",
  updateError: null,
  deleteStatus: "idle",
  deleteError: null,
};

const addressesSlice = createSlice({
  name: "addresses",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
    resetUpdateStatus(state) {
      state.updateStatus = "idle";
      state.updateError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAddresses.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load addresses";
      })

      .addCase(createAddress.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(createAddress.fulfilled, (state) => {
        state.saveStatus = "succeeded";
      })
      .addCase(createAddress.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to add address";
      })

      .addCase(updateAddress.pending, (state) => {
        state.updateStatus = "loading";
        state.updateError = null;
      })
      .addCase(updateAddress.fulfilled, (state) => {
        state.updateStatus = "succeeded";
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.updateError = action.payload ?? "Failed to update address";
      })

      .addCase(deleteAddress.pending, (state) => {
        state.deleteStatus = "loading";
        state.deleteError = null;
      })
      .addCase(deleteAddress.fulfilled, (state) => {
        state.deleteStatus = "succeeded";
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload ?? "Failed to delete address";
      });
  },
});

export const { resetSaveStatus, resetUpdateStatus } = addressesSlice.actions;
export default addressesSlice.reducer;
