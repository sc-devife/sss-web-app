import type { RootState } from "@/store/store";
import type { Quote } from "@/features/quotes/types";

const EMPTY_QUOTES: Quote[] = [];

export const selectQuotesForItinerary = (state: RootState, itineraryUid: string) =>
  state.quotes.quotesByItinerary[itineraryUid] ?? EMPTY_QUOTES;

export const selectQuotesStatus = (state: RootState, itineraryUid: string) =>
  state.quotes.statusByItinerary[itineraryUid] ?? "idle";

export const selectQuotesError = (state: RootState, itineraryUid: string) =>
  state.quotes.errorByItinerary[itineraryUid] ?? null;

export const selectCurrencies = (state: RootState) => state.quotes.currencies;
export const selectCurrenciesStatus = (state: RootState) => state.quotes.currenciesStatus;

export const selectQuoteSaveStatus = (state: RootState) => state.quotes.saveStatus;
export const selectQuoteSaveError = (state: RootState) => state.quotes.saveError;

export const selectQuoteComputeStatus = (state: RootState) => state.quotes.computeStatus;
export const selectQuoteComputeError = (state: RootState) => state.quotes.computeError;
