import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { InvoiceTemplate, SetDefaultInvoiceTemplatePayload } from "@/features/invoiceTemplates/types";

export const fetchInvoiceTemplates = createAsyncThunk<InvoiceTemplate[], void, { rejectValue: string }>(
  "invoiceTemplates/fetchInvoiceTemplates",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<InvoiceTemplate[]>("/invoice-templates");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load invoice templates"));
    }
  },
);

// See the equivalent comment in quoteTemplatesThunks.ts — mutates Organization,
// not this module's own data.
export const setDefaultInvoiceTemplate = createAsyncThunk<void, SetDefaultInvoiceTemplatePayload, { rejectValue: string }>(
  "invoiceTemplates/setDefaultInvoiceTemplate",
  async ({ organizationUid, templateId }, { rejectWithValue }) => {
    try {
      await clientApi.put("/organizations", { uid: organizationUid, invoice_template_id: templateId });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to set default template"));
    }
  },
);
