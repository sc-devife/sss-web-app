import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type {
  IntegrationConnection,
  WebhookEvent,
  LeadImportAttempt,
  FieldMapping,
  Page,
  ConnectIntegrationPayload,
  SaveFieldMappingPayload,
} from "@/features/integrations/types";

export const fetchIntegrations = createAsyncThunk<IntegrationConnection[], void, { rejectValue: string }>(
  "integrations/fetchIntegrations",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<IntegrationConnection[]>("/integrations");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load integrations"));
    }
  },
);

export const fetchLeadSources = createAsyncThunk<IntegrationConnection[], void, { rejectValue: string }>(
  "integrations/fetchLeadSources",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<IntegrationConnection[]>("/lead-sources");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load lead sources"));
    }
  },
);

export const connectIntegration = createAsyncThunk<void, ConnectIntegrationPayload, { rejectValue: string }>(
  "integrations/connectIntegration",
  async ({ channelCode, body }, { rejectWithValue }) => {
    try {
      await clientApi.post(`/integrations/${channelCode}/connect`, body);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to connect"));
    }
  },
);

export const disconnectIntegration = createAsyncThunk<void, string, { rejectValue: string }>(
  "integrations/disconnectIntegration",
  async (channelCode, { rejectWithValue }) => {
    try {
      await clientApi.post(`/integrations/${channelCode}/disconnect`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to disconnect"));
    }
  },
);

export const fetchWebhookEvents = createAsyncThunk<Page<WebhookEvent>, string, { rejectValue: string }>(
  "integrations/fetchWebhookEvents",
  async (channelCode, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<Page<WebhookEvent>>(`/lead-sources/${channelCode}/webhook-events`);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load webhook events"));
    }
  },
);

export const fetchImportAttempts = createAsyncThunk<Page<LeadImportAttempt>, string, { rejectValue: string }>(
  "integrations/fetchImportAttempts",
  async (channelCode, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<Page<LeadImportAttempt>>(`/lead-sources/${channelCode}/import-attempts`);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load sync history"));
    }
  },
);

export const resyncImportAttempt = createAsyncThunk<void, string, { rejectValue: string }>(
  "integrations/resyncImportAttempt",
  async (uid, { rejectWithValue }) => {
    try {
      await clientApi.post(`/lead-sources/import-attempts/${uid}/resync`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to resync"));
    }
  },
);

export const fetchFieldMappings = createAsyncThunk<FieldMapping[], string, { rejectValue: string }>(
  "integrations/fetchFieldMappings",
  async (channelCode, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<FieldMapping[]>(`/lead-sources/${channelCode}/field-mappings`);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load field mappings"));
    }
  },
);

export const saveFieldMapping = createAsyncThunk<void, SaveFieldMappingPayload, { rejectValue: string }>(
  "integrations/saveFieldMapping",
  async ({ channelCode, formId, metaFieldKey, crmField }, { rejectWithValue }) => {
    try {
      await clientApi.put(`/lead-sources/${channelCode}/field-mappings`, { formId, metaFieldKey, crmField });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save mapping"));
    }
  },
);
