import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { QuoteTemplate, SetDefaultQuoteTemplatePayload } from "@/features/quoteTemplates/types";

export const fetchQuoteTemplates = createAsyncThunk<QuoteTemplate[], void, { rejectValue: string }>(
  "quoteTemplates/fetchQuoteTemplates",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<QuoteTemplate[]>("/quote-templates");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load quote templates"));
    }
  },
);

// Mutates OrganizationSettings (its quote_template_id), not this module's
// own data — same "different entity as a side effect" shape as
// ConvertToEscapeModal's traveller creation. Organization itself isn't Redux-
// managed yet, so the panel calls router.refresh() afterward to pick up the
// new default from its still-server-fetched organization prop.
export const setDefaultQuoteTemplate = createAsyncThunk<void, SetDefaultQuoteTemplatePayload, { rejectValue: string }>(
  "quoteTemplates/setDefaultQuoteTemplate",
  async ({ templateId }, { rejectWithValue }) => {
    try {
      await clientApi.put("/organizations/settings", { quote_template_id: templateId });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to set default template"));
    }
  },
);
