import type { RootState } from "@/store/store";

export const selectIncomingTransactions = (state: RootState) => state.transactions.incoming;
export const selectIncomingTransactionsStatus = (state: RootState) => state.transactions.incomingStatus;
export const selectIncomingTransactionsError = (state: RootState) => state.transactions.incomingError;

export const selectOutgoingTransactions = (state: RootState) => state.transactions.outgoing;
export const selectOutgoingTransactionsStatus = (state: RootState) => state.transactions.outgoingStatus;
export const selectOutgoingTransactionsError = (state: RootState) => state.transactions.outgoingError;
