import { createSlice } from "@reduxjs/toolkit";
import type { Deal } from "@/features/deals/types";
import { fetchDealForEscape, acceptQuote, cancelDeal } from "@/features/deals/dealsThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface DealsState {
  deal: Deal | null;
  status: RequestStatus;
  error: string | null;

  acceptStatus: RequestStatus;
  acceptError: string | null;

  cancelStatus: RequestStatus;
  cancelError: string | null;
}

const initialState: DealsState = {
  deal: null,
  status: "idle",
  error: null,
  acceptStatus: "idle",
  acceptError: null,
  cancelStatus: "idle",
  cancelError: null,
};

const dealsSlice = createSlice({
  name: "deals",
  initialState,
  reducers: {
    resetAcceptStatus(state) {
      state.acceptStatus = "idle";
      state.acceptError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDealForEscape.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchDealForEscape.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.deal = action.payload;
      })
      .addCase(fetchDealForEscape.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load deal";
      })

      .addCase(acceptQuote.pending, (state) => {
        state.acceptStatus = "loading";
        state.acceptError = null;
      })
      .addCase(acceptQuote.fulfilled, (state) => {
        state.acceptStatus = "succeeded";
      })
      .addCase(acceptQuote.rejected, (state, action) => {
        state.acceptStatus = "failed";
        state.acceptError = action.payload ?? "Failed to accept quote";
      })

      .addCase(cancelDeal.pending, (state) => {
        state.cancelStatus = "loading";
        state.cancelError = null;
      })
      .addCase(cancelDeal.fulfilled, (state, action) => {
        state.cancelStatus = "succeeded";
        if (state.deal && state.deal.uid === action.meta.arg.uid) {
          state.deal.status = "cancelled";
        }
      })
      .addCase(cancelDeal.rejected, (state, action) => {
        state.cancelStatus = "failed";
        state.cancelError = action.payload ?? "Failed to cancel deal";
      });
  },
});

export const { resetAcceptStatus } = dealsSlice.actions;
export default dealsSlice.reducer;
