import { createSlice } from "@reduxjs/toolkit";
import type { QuotationTemplate } from "@/features/quotationTemplates/types";
import {
  fetchQuotationTemplates,
  createQuotationTemplate,
  updateQuotationTemplate,
  deleteQuotationTemplate,
  setDefaultQuotationTemplate,
} from "@/features/quotationTemplates/quotationTemplatesThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface QuotationTemplatesState {
  items: QuotationTemplate[];
  status: RequestStatus;
  error: string | null;
  saveStatus: RequestStatus;
  saveError: string | null;
}

const initialState: QuotationTemplatesState = {
  items: [],
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
};

const quotationTemplatesSlice = createSlice({
  name: "quotationTemplates",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuotationTemplates.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchQuotationTemplates.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchQuotationTemplates.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load quotation templates";
      })

      .addCase(createQuotationTemplate.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(createQuotationTemplate.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        state.items.push(action.payload);
      })
      .addCase(createQuotationTemplate.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to create quotation template";
      })

      .addCase(updateQuotationTemplate.fulfilled, (state, action) => {
        const idx = state.items.findIndex((t) => t.uid === action.payload.uid);
        if (idx >= 0) state.items[idx] = action.payload;
      })

      .addCase(deleteQuotationTemplate.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.uid !== action.payload);
      })

      .addCase(setDefaultQuotationTemplate.fulfilled, (state, action) => {
        state.items = state.items.map((t) => ({ ...t, isDefault: t.uid === action.payload }));
      });
  },
});

export const { resetSaveStatus } = quotationTemplatesSlice.actions;
export default quotationTemplatesSlice.reducer;
