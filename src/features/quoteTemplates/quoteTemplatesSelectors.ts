import type { RootState } from "@/store/store";

export const selectQuoteTemplates = (state: RootState) => state.quoteTemplates.items;
export const selectQuoteTemplatesStatus = (state: RootState) => state.quoteTemplates.status;
export const selectQuoteTemplatesError = (state: RootState) => state.quoteTemplates.error;
