import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import type { PaymentMilestone } from "@/features/paymentMilestones/types";
import {
  fetchMilestonesForDeal,
  createPaymentMilestone,
  recordPayment,
  verifyPaymentMilestone,
  deletePaymentMilestone,
} from "@/features/paymentMilestones/paymentMilestonesThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface PaymentMilestonesState {
  items: PaymentMilestone[];
  status: RequestStatus;
  error: string | null;

  saveStatus: RequestStatus;
  saveError: string | null;

  recordPaymentStatus: RequestStatus;
  recordPaymentError: string | null;

  deleteStatus: RequestStatus;
  deleteError: string | null;
}

const initialState: PaymentMilestonesState = {
  items: [],
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
  recordPaymentStatus: "idle",
  recordPaymentError: null,
  deleteStatus: "idle",
  deleteError: null,
};

const paymentMilestonesSlice = createSlice({
  name: "paymentMilestones",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMilestonesForDeal.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMilestonesForDeal.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchMilestonesForDeal.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load payment milestones";
      })

      .addCase(createPaymentMilestone.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(createPaymentMilestone.fulfilled, (state) => {
        state.saveStatus = "succeeded";
      })
      .addCase(createPaymentMilestone.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to add milestone";
      })

      .addCase(deletePaymentMilestone.pending, (state) => {
        state.deleteStatus = "loading";
        state.deleteError = null;
      })
      .addCase(deletePaymentMilestone.fulfilled, (state) => {
        state.deleteStatus = "succeeded";
      })
      .addCase(deletePaymentMilestone.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload ?? "Failed to delete milestone";
      })

      .addMatcher(isAnyOf(recordPayment.pending, verifyPaymentMilestone.pending), (state) => {
        state.recordPaymentStatus = "loading";
        state.recordPaymentError = null;
      })
      .addMatcher(isAnyOf(recordPayment.fulfilled, verifyPaymentMilestone.fulfilled), (state) => {
        state.recordPaymentStatus = "succeeded";
      })
      .addMatcher(isAnyOf(recordPayment.rejected, verifyPaymentMilestone.rejected), (state, action) => {
        state.recordPaymentStatus = "failed";
        state.recordPaymentError = action.payload ?? "Failed to record payment";
      });
  },
});

export const { resetSaveStatus } = paymentMilestonesSlice.actions;
export default paymentMilestonesSlice.reducer;
