import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type {
  Quote,
  SupportedCurrency,
  CreateQuotePayload,
  RenameQuotePayload,
  SetQuoteTemplatePayload,
  ComputeQuotePayload,
  ComputeQuoteResult,
  QuoteUidWithItinerary,
} from "@/features/quotes/types";

// Keyed by itineraryUid in the slice — several ItineraryCards can be
// expanded at once, each with its own Quotes panel.
export const fetchQuotesForItinerary = createAsyncThunk<{ itineraryUid: string; quotes: Quote[] }, string, { rejectValue: string }>(
  "quotes/fetchQuotesForItinerary",
  async (itineraryUid, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<Quote[]>(`/quotes?itineraryUid=${itineraryUid}`);
      return { itineraryUid, quotes: res.data };
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load quotes"));
    }
  },
);

export const fetchCurrencies = createAsyncThunk<SupportedCurrency[], void, { rejectValue: string }>(
  "quotes/fetchCurrencies",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<SupportedCurrency[]>("/currencies");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load currencies"));
    }
  },
);

export const createQuote = createAsyncThunk<void, CreateQuotePayload, { rejectValue: string }>(
  "quotes/createQuote",
  async (payload, { rejectWithValue }) => {
    try {
      await clientApi.post("/quotes", payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to create quote"));
    }
  },
);

export const renameQuote = createAsyncThunk<void, RenameQuotePayload, { rejectValue: string }>(
  "quotes/renameQuote",
  async ({ uid, name }, { rejectWithValue }) => {
    try {
      await clientApi.put(`/quotes/${uid}`, { name });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to rename quote"));
    }
  },
);

export const reviseQuote = createAsyncThunk<void, QuoteUidWithItinerary, { rejectValue: string }>(
  "quotes/reviseQuote",
  async ({ uid }, { rejectWithValue }) => {
    try {
      await clientApi.post(`/quotes/${uid}/revise`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to revise quote"));
    }
  },
);

export const deleteQuote = createAsyncThunk<void, QuoteUidWithItinerary, { rejectValue: string }>(
  "quotes/deleteQuote",
  async ({ uid }, { rejectWithValue }) => {
    try {
      await clientApi.delete(`/quotes/${uid}`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to delete quote"));
    }
  },
);

export const setQuoteTemplate = createAsyncThunk<void, SetQuoteTemplatePayload, { rejectValue: string }>(
  "quotes/setQuoteTemplate",
  async ({ uid, templateId }, { rejectWithValue }) => {
    try {
      await clientApi.put(`/quotes/${uid}`, { templateId });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to set template"));
    }
  },
);

export const computeQuote = createAsyncThunk<ComputeQuoteResult, ComputeQuotePayload, { rejectValue: string }>(
  "quotes/computeQuote",
  async ({ uid, taxProfileUid, discountType, discountValue, displayCurrencyCode, fxRateSnapshot }, { rejectWithValue }) => {
    try {
      const res = await clientApi.post<ComputeQuoteResult>(`/quotes/${uid}/compute`, {
        taxProfileUid,
        discountType,
        discountValue,
        displayCurrencyCode,
        fxRateSnapshot,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to compute pricing"));
    }
  },
);
