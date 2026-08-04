import { createSlice } from "@reduxjs/toolkit";
import type { InvoiceTemplate } from "@/features/invoiceTemplates/types";
import { fetchInvoiceTemplates, setDefaultInvoiceTemplate } from "@/features/invoiceTemplates/invoiceTemplatesThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface InvoiceTemplatesState {
  items: InvoiceTemplate[];
  status: RequestStatus;
  error: string | null;

  setDefaultStatus: RequestStatus;
  setDefaultError: string | null;
}

const initialState: InvoiceTemplatesState = {
  items: [],
  status: "idle",
  error: null,
  setDefaultStatus: "idle",
  setDefaultError: null,
};

const invoiceTemplatesSlice = createSlice({
  name: "invoiceTemplates",
  initialState,
  reducers: {
    resetSetDefaultStatus(state) {
      state.setDefaultStatus = "idle";
      state.setDefaultError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoiceTemplates.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchInvoiceTemplates.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchInvoiceTemplates.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load invoice templates";
      })

      .addCase(setDefaultInvoiceTemplate.pending, (state) => {
        state.setDefaultStatus = "loading";
        state.setDefaultError = null;
      })
      .addCase(setDefaultInvoiceTemplate.fulfilled, (state) => {
        state.setDefaultStatus = "succeeded";
      })
      .addCase(setDefaultInvoiceTemplate.rejected, (state, action) => {
        state.setDefaultStatus = "failed";
        state.setDefaultError = action.payload ?? "Failed to set default template";
      });
  },
});

export const { resetSetDefaultStatus } = invoiceTemplatesSlice.actions;
export default invoiceTemplatesSlice.reducer;
