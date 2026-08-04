import type { RootState } from "@/store/store";

export const selectInvoiceTemplates = (state: RootState) => state.invoiceTemplates.items;
export const selectInvoiceTemplatesStatus = (state: RootState) => state.invoiceTemplates.status;
export const selectInvoiceTemplatesError = (state: RootState) => state.invoiceTemplates.error;
