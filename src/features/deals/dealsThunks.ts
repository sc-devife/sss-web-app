import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { Deal, AcceptQuotePayload, CancelDealPayload } from "@/features/deals/types";

// Mirrors lib/deals.ts's getDealForEscape: a 404 (no deal yet) is a normal,
// expected outcome for this endpoint, not a failure — resolve to null rather
// than rejecting so the panel doesn't show an error state for "no deal yet".
export const fetchDealForEscape = createAsyncThunk<Deal | null, string, { rejectValue: string }>(
  "deals/fetchDealForEscape",
  async (escapeUid, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<Deal>(`/deals?escapeUid=${escapeUid}`, { validateStatus: (s) => s === 200 || s === 404 });
      return res.status === 200 ? res.data : null;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load deal"));
    }
  },
);

export const acceptQuote = createAsyncThunk<void, AcceptQuotePayload, { rejectValue: string }>(
  "deals/acceptQuote",
  async ({ quoteUid }, { rejectWithValue }) => {
    try {
      await clientApi.post(`/deals/accept-quote/${quoteUid}`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to accept quote"));
    }
  },
);

export const cancelDeal = createAsyncThunk<void, CancelDealPayload, { rejectValue: string }>(
  "deals/cancelDeal",
  async ({ uid, reason }, { rejectWithValue }) => {
    try {
      await clientApi.post(`/deals/${uid}/cancel`, { reason });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to cancel deal"));
    }
  },
);
