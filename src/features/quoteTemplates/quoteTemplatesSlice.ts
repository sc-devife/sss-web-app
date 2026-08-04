import { createSlice } from "@reduxjs/toolkit";
import type { QuoteTemplate } from "@/features/quoteTemplates/types";
import { fetchQuoteTemplates, setDefaultQuoteTemplate } from "@/features/quoteTemplates/quoteTemplatesThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface QuoteTemplatesState {
  items: QuoteTemplate[];
  status: RequestStatus;
  error: string | null;

  setDefaultStatus: RequestStatus;
  setDefaultError: string | null;
}

const initialState: QuoteTemplatesState = {
  items: [],
  status: "idle",
  error: null,
  setDefaultStatus: "idle",
  setDefaultError: null,
};

const quoteTemplatesSlice = createSlice({
  name: "quoteTemplates",
  initialState,
  reducers: {
    resetSetDefaultStatus(state) {
      state.setDefaultStatus = "idle";
      state.setDefaultError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuoteTemplates.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchQuoteTemplates.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchQuoteTemplates.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load quote templates";
      })

      .addCase(setDefaultQuoteTemplate.pending, (state) => {
        state.setDefaultStatus = "loading";
        state.setDefaultError = null;
      })
      .addCase(setDefaultQuoteTemplate.fulfilled, (state) => {
        state.setDefaultStatus = "succeeded";
      })
      .addCase(setDefaultQuoteTemplate.rejected, (state, action) => {
        state.setDefaultStatus = "failed";
        state.setDefaultError = action.payload ?? "Failed to set default template";
      });
  },
});

export const { resetSetDefaultStatus } = quoteTemplatesSlice.actions;
export default quoteTemplatesSlice.reducer;
