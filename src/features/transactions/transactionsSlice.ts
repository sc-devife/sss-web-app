import { createSlice } from "@reduxjs/toolkit";
import type { IncomingTransaction } from "@/features/transactions/types";
import { fetchIncomingTransactions } from "@/features/transactions/transactionsThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface TransactionsState {
  incoming: IncomingTransaction[];
  incomingStatus: RequestStatus;
  incomingError: string | null;
}

const initialState: TransactionsState = {
  incoming: [],
  incomingStatus: "idle",
  incomingError: null,
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
      });
  },
});

export default transactionsSlice.reducer;
