import { createSlice } from "@reduxjs/toolkit";
import type { Quote, SupportedCurrency } from "@/features/quotes/types";
import {
  fetchQuotesForItinerary,
  fetchCurrencies,
  createQuote,
  reviseQuote,
  deleteQuote,
  setQuoteTemplate,
  computeQuote,
} from "@/features/quotes/quotesThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface QuotesState {
  quotesByItinerary: Record<string, Quote[]>;
  statusByItinerary: Record<string, RequestStatus>;
  errorByItinerary: Record<string, string | null>;

  currencies: SupportedCurrency[];
  currenciesStatus: RequestStatus;

  saveStatus: RequestStatus;
  saveError: string | null;

  reviseStatus: RequestStatus;
  reviseError: string | null;

  deleteStatus: RequestStatus;
  deleteError: string | null;

  setTemplateStatus: RequestStatus;

  computeStatus: RequestStatus;
  computeError: string | null;
}

const initialState: QuotesState = {
  quotesByItinerary: {},
  statusByItinerary: {},
  errorByItinerary: {},
  currencies: [],
  currenciesStatus: "idle",
  saveStatus: "idle",
  saveError: null,
  reviseStatus: "idle",
  reviseError: null,
  deleteStatus: "idle",
  deleteError: null,
  setTemplateStatus: "idle",
  computeStatus: "idle",
  computeError: null,
};

const quotesSlice = createSlice({
  name: "quotes",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
    resetComputeStatus(state) {
      state.computeStatus = "idle";
      state.computeError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuotesForItinerary.pending, (state, action) => {
        state.statusByItinerary[action.meta.arg] = "loading";
        state.errorByItinerary[action.meta.arg] = null;
      })
      .addCase(fetchQuotesForItinerary.fulfilled, (state, action) => {
        state.statusByItinerary[action.payload.itineraryUid] = "succeeded";
        state.quotesByItinerary[action.payload.itineraryUid] = action.payload.quotes;
      })
      .addCase(fetchQuotesForItinerary.rejected, (state, action) => {
        state.statusByItinerary[action.meta.arg] = "failed";
        state.errorByItinerary[action.meta.arg] = action.payload ?? "Failed to load quotes";
      })

      .addCase(fetchCurrencies.pending, (state) => {
        state.currenciesStatus = "loading";
      })
      .addCase(fetchCurrencies.fulfilled, (state, action) => {
        state.currenciesStatus = "succeeded";
        state.currencies = action.payload;
      })
      .addCase(fetchCurrencies.rejected, (state) => {
        state.currenciesStatus = "failed";
      })

      .addCase(createQuote.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(createQuote.fulfilled, (state) => {
        state.saveStatus = "succeeded";
      })
      .addCase(createQuote.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to create quote";
      })

      .addCase(reviseQuote.pending, (state) => {
        state.reviseStatus = "loading";
        state.reviseError = null;
      })
      .addCase(reviseQuote.fulfilled, (state) => {
        state.reviseStatus = "succeeded";
      })
      .addCase(reviseQuote.rejected, (state, action) => {
        state.reviseStatus = "failed";
        state.reviseError = action.payload ?? "Failed to revise quote";
      })

      .addCase(deleteQuote.pending, (state) => {
        state.deleteStatus = "loading";
        state.deleteError = null;
      })
      .addCase(deleteQuote.fulfilled, (state) => {
        state.deleteStatus = "succeeded";
      })
      .addCase(deleteQuote.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload ?? "Failed to delete quote";
      })

      .addCase(setQuoteTemplate.pending, (state) => {
        state.setTemplateStatus = "loading";
      })
      .addCase(setQuoteTemplate.fulfilled, (state) => {
        state.setTemplateStatus = "succeeded";
      })
      .addCase(setQuoteTemplate.rejected, (state) => {
        state.setTemplateStatus = "failed";
      })

      .addCase(computeQuote.pending, (state) => {
        state.computeStatus = "loading";
        state.computeError = null;
      })
      .addCase(computeQuote.fulfilled, (state) => {
        state.computeStatus = "succeeded";
      })
      .addCase(computeQuote.rejected, (state, action) => {
        state.computeStatus = "failed";
        state.computeError = action.payload ?? "Failed to compute pricing";
      });
  },
});

export const { resetSaveStatus, resetComputeStatus } = quotesSlice.actions;
export default quotesSlice.reducer;
