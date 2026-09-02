import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type {
  QuotationTemplate,
  CreateQuotationTemplatePayload,
  UpdateQuotationTemplatePayload,
} from "@/features/quotationTemplates/types";

export const fetchQuotationTemplates = createAsyncThunk<QuotationTemplate[], void, { rejectValue: string }>(
  "quotationTemplates/fetchAll",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<QuotationTemplate[]>("/quotation-templates");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load quotation templates"));
    }
  },
);

export const createQuotationTemplate = createAsyncThunk<QuotationTemplate, CreateQuotationTemplatePayload, { rejectValue: string }>(
  "quotationTemplates/create",
  async (payload, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.set("name", payload.name);
      formData.set("description", payload.description);
      formData.set("file", payload.file);
      if (payload.previewImage) formData.set("previewImage", payload.previewImage);
      const res = await clientApi.postForm<QuotationTemplate>("/quotation-templates", formData);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to create quotation template"));
    }
  },
);

export const updateQuotationTemplate = createAsyncThunk<QuotationTemplate, UpdateQuotationTemplatePayload, { rejectValue: string }>(
  "quotationTemplates/update",
  async (payload, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      if (payload.name !== undefined) formData.set("name", payload.name);
      if (payload.description !== undefined) formData.set("description", payload.description);
      if (payload.isActive !== undefined) formData.set("isActive", String(payload.isActive));
      if (payload.file) formData.set("file", payload.file);
      if (payload.previewImage) formData.set("previewImage", payload.previewImage);
      const res = await clientApi.putForm<QuotationTemplate>(`/quotation-templates/${payload.uid}`, formData);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to update quotation template"));
    }
  },
);

export const deleteQuotationTemplate = createAsyncThunk<string, string, { rejectValue: string }>(
  "quotationTemplates/delete",
  async (uid, { rejectWithValue }) => {
    try {
      await clientApi.delete(`/quotation-templates/${uid}`);
      return uid;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to delete quotation template"));
    }
  },
);

export const setDefaultQuotationTemplate = createAsyncThunk<string, string, { rejectValue: string }>(
  "quotationTemplates/setDefault",
  async (uid, { rejectWithValue }) => {
    try {
      await clientApi.post(`/quotation-templates/${uid}/set-default`);
      return uid;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to set default template"));
    }
  },
);
