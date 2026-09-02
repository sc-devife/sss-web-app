import type { RootState } from "@/store/store";

export const selectIncomingTransactions = (state: RootState) => state.transactions.incoming;
export const selectIncomingTransactionsStatus = (state: RootState) => state.transactions.incomingStatus;
export const selectIncomingTransactionsError = (state: RootState) => state.transactions.incomingError;
