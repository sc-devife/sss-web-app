import type { RootState } from "@/store/store";

export const selectDeal = (state: RootState) => state.deals.deal;
export const selectDealStatus = (state: RootState) => state.deals.status;
export const selectDealError = (state: RootState) => state.deals.error;

export const selectAcceptQuoteStatus = (state: RootState) => state.deals.acceptStatus;
export const selectAcceptQuoteError = (state: RootState) => state.deals.acceptError;
