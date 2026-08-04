import { createSlice } from "@reduxjs/toolkit";
import type { IntegrationConnection, WebhookEvent, LeadImportAttempt, FieldMapping, Page } from "@/features/integrations/types";
import {
  fetchIntegrations,
  fetchLeadSources,
  connectIntegration,
  disconnectIntegration,
  fetchWebhookEvents,
  fetchImportAttempts,
  resyncImportAttempt,
  fetchFieldMappings,
  saveFieldMapping,
} from "@/features/integrations/integrationsThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface IntegrationsState {
  integrations: IntegrationConnection[];
  integrationsStatus: RequestStatus;
  integrationsError: string | null;

  leadSources: IntegrationConnection[];
  leadSourcesStatus: RequestStatus;
  leadSourcesError: string | null;

  connectStatus: RequestStatus;
  connectError: string | null;

  disconnectStatus: RequestStatus;
  disconnectError: string | null;

  webhookEvents: Page<WebhookEvent> | null;
  webhookEventsStatus: RequestStatus;
  webhookEventsError: string | null;

  importAttempts: Page<LeadImportAttempt> | null;
  importAttemptsStatus: RequestStatus;
  importAttemptsError: string | null;

  resyncStatus: RequestStatus;
  resyncError: string | null;

  fieldMappings: FieldMapping[];
  fieldMappingsStatus: RequestStatus;
  fieldMappingsError: string | null;

  saveFieldMappingStatus: RequestStatus;
  saveFieldMappingError: string | null;
}

const initialState: IntegrationsState = {
  integrations: [],
  integrationsStatus: "idle",
  integrationsError: null,
  leadSources: [],
  leadSourcesStatus: "idle",
  leadSourcesError: null,
  connectStatus: "idle",
  connectError: null,
  disconnectStatus: "idle",
  disconnectError: null,
  webhookEvents: null,
  webhookEventsStatus: "idle",
  webhookEventsError: null,
  importAttempts: null,
  importAttemptsStatus: "idle",
  importAttemptsError: null,
  resyncStatus: "idle",
  resyncError: null,
  fieldMappings: [],
  fieldMappingsStatus: "idle",
  fieldMappingsError: null,
  saveFieldMappingStatus: "idle",
  saveFieldMappingError: null,
};

const integrationsSlice = createSlice({
  name: "integrations",
  initialState,
  reducers: {
    resetConnectStatus(state) {
      state.connectStatus = "idle";
      state.connectError = null;
    },
    resetSaveFieldMappingStatus(state) {
      state.saveFieldMappingStatus = "idle";
      state.saveFieldMappingError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIntegrations.pending, (state) => {
        state.integrationsStatus = "loading";
        state.integrationsError = null;
      })
      .addCase(fetchIntegrations.fulfilled, (state, action) => {
        state.integrationsStatus = "succeeded";
        state.integrations = action.payload;
      })
      .addCase(fetchIntegrations.rejected, (state, action) => {
        state.integrationsStatus = "failed";
        state.integrationsError = action.payload ?? "Failed to load integrations";
      })

      .addCase(fetchLeadSources.pending, (state) => {
        state.leadSourcesStatus = "loading";
        state.leadSourcesError = null;
      })
      .addCase(fetchLeadSources.fulfilled, (state, action) => {
        state.leadSourcesStatus = "succeeded";
        state.leadSources = action.payload;
      })
      .addCase(fetchLeadSources.rejected, (state, action) => {
        state.leadSourcesStatus = "failed";
        state.leadSourcesError = action.payload ?? "Failed to load lead sources";
      })

      .addCase(connectIntegration.pending, (state) => {
        state.connectStatus = "loading";
        state.connectError = null;
      })
      .addCase(connectIntegration.fulfilled, (state) => {
        state.connectStatus = "succeeded";
      })
      .addCase(connectIntegration.rejected, (state, action) => {
        state.connectStatus = "failed";
        state.connectError = action.payload ?? "Failed to connect";
      })

      .addCase(disconnectIntegration.pending, (state) => {
        state.disconnectStatus = "loading";
        state.disconnectError = null;
      })
      .addCase(disconnectIntegration.fulfilled, (state) => {
        state.disconnectStatus = "succeeded";
      })
      .addCase(disconnectIntegration.rejected, (state, action) => {
        state.disconnectStatus = "failed";
        state.disconnectError = action.payload ?? "Failed to disconnect";
      })

      .addCase(fetchWebhookEvents.pending, (state) => {
        state.webhookEventsStatus = "loading";
        state.webhookEventsError = null;
      })
      .addCase(fetchWebhookEvents.fulfilled, (state, action) => {
        state.webhookEventsStatus = "succeeded";
        state.webhookEvents = action.payload;
      })
      .addCase(fetchWebhookEvents.rejected, (state, action) => {
        state.webhookEventsStatus = "failed";
        state.webhookEventsError = action.payload ?? "Failed to load webhook events";
      })

      .addCase(fetchImportAttempts.pending, (state) => {
        state.importAttemptsStatus = "loading";
        state.importAttemptsError = null;
      })
      .addCase(fetchImportAttempts.fulfilled, (state, action) => {
        state.importAttemptsStatus = "succeeded";
        state.importAttempts = action.payload;
      })
      .addCase(fetchImportAttempts.rejected, (state, action) => {
        state.importAttemptsStatus = "failed";
        state.importAttemptsError = action.payload ?? "Failed to load sync history";
      })

      .addCase(resyncImportAttempt.pending, (state) => {
        state.resyncStatus = "loading";
        state.resyncError = null;
      })
      .addCase(resyncImportAttempt.fulfilled, (state) => {
        state.resyncStatus = "succeeded";
      })
      .addCase(resyncImportAttempt.rejected, (state, action) => {
        state.resyncStatus = "failed";
        state.resyncError = action.payload ?? "Failed to resync";
      })

      .addCase(fetchFieldMappings.pending, (state) => {
        state.fieldMappingsStatus = "loading";
        state.fieldMappingsError = null;
      })
      .addCase(fetchFieldMappings.fulfilled, (state, action) => {
        state.fieldMappingsStatus = "succeeded";
        state.fieldMappings = action.payload;
      })
      .addCase(fetchFieldMappings.rejected, (state, action) => {
        state.fieldMappingsStatus = "failed";
        state.fieldMappingsError = action.payload ?? "Failed to load field mappings";
      })

      .addCase(saveFieldMapping.pending, (state) => {
        state.saveFieldMappingStatus = "loading";
        state.saveFieldMappingError = null;
      })
      .addCase(saveFieldMapping.fulfilled, (state) => {
        state.saveFieldMappingStatus = "succeeded";
      })
      .addCase(saveFieldMapping.rejected, (state, action) => {
        state.saveFieldMappingStatus = "failed";
        state.saveFieldMappingError = action.payload ?? "Failed to save mapping";
      });
  },
});

export const { resetConnectStatus, resetSaveFieldMappingStatus } = integrationsSlice.actions;
export default integrationsSlice.reducer;
