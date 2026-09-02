import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { IncomingTransaction } from "@/features/transactions/types";

export const fetchIncomingTransactions = createAsyncThunk<IncomingTransaction[], void, { rejectValue: string }>(
  "transactions/fetchIncomingTransactions",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<IncomingTransaction[]>("/transactions/incoming");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load incoming transactions"));
    }
  },
);
