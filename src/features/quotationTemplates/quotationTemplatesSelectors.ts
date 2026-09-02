import type { RootState } from "@/store/store";

export const selectQuotationTemplates = (state: RootState) => state.quotationTemplates.items;
export const selectQuotationTemplatesStatus = (state: RootState) => state.quotationTemplates.status;
export const selectQuotationTemplatesError = (state: RootState) => state.quotationTemplates.error;
export const selectQuotationTemplateSaveStatus = (state: RootState) => state.quotationTemplates.saveStatus;
export const selectQuotationTemplateSaveError = (state: RootState) => state.quotationTemplates.saveError;
