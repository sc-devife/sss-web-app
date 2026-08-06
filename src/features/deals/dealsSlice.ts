import { createSlice } from "@reduxjs/toolkit";
import type { Deal } from "@/features/deals/types";
import { fetchDealForEscape, acceptQuote } from "@/features/deals/dealsThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface DealsState {
  deal: Deal | null;
  status: RequestStatus;
  error: string | null;

  acceptStatus: RequestStatus;
  acceptError: string | null;
}

const initialState: DealsState = {
  deal: null,
  status: "idle",
  error: null,
  acceptStatus: "idle",
  acceptError: null,
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
      });
  },
});

export const { resetAcceptStatus } = dealsSlice.actions;
export default dealsSlice.reducer;
