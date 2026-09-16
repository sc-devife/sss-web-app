import { createSlice } from "@reduxjs/toolkit";
import type { IncomingTransaction, OutgoingTransaction } from "@/features/transactions/types";
import { fetchIncomingTransactions, fetchOutgoingTransactions } from "@/features/transactions/transactionsThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface TransactionsState {
  incoming: IncomingTransaction[];
  incomingStatus: RequestStatus;
  incomingError: string | null;
  outgoing: OutgoingTransaction[];
  outgoingStatus: RequestStatus;
  outgoingError: string | null;
}

const initialState: TransactionsState = {
  incoming: [],
  incomingStatus: "idle",
  incomingError: null,
  outgoing: [],
  outgoingStatus: "idle",
  outgoingError: null,
};

const transactionsSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchIncomingTransactions.pending, (state) => {
        state.incomingStatus = "loading";
        state.incomingError = null;
      })
      .addCase(fetchIncomingTransactions.fulfilled, (state, action) => {
        state.incomingStatus = "succeeded";
        state.incoming = action.payload;
      })
      .addCase(fetchIncomingTransactions.rejected, (state, action) => {
        state.incomingStatus = "failed";
        state.incomingError = action.payload ?? "Failed to load incoming transactions";
      })
      .addCase(fetchOutgoingTransactions.pending, (state) => {
        state.outgoingStatus = "loading";
        state.outgoingError = null;
      })
      .addCase(fetchOutgoingTransactions.fulfilled, (state, action) => {
        state.outgoingStatus = "succeeded";
        state.outgoing = action.payload;
      })
      .addCase(fetchOutgoingTransactions.rejected, (state, action) => {
        state.outgoingStatus = "failed";
        state.outgoingError = action.payload ?? "Failed to load outgoing transactions";
      });
  },
});

export default transactionsSlice.reducer;
