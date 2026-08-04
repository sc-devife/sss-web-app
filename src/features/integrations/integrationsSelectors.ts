import type { RootState } from "@/store/store";

export const selectIntegrations = (state: RootState) => state.integrations.integrations;
export const selectIntegrationsStatus = (state: RootState) => state.integrations.integrationsStatus;
export const selectIntegrationsError = (state: RootState) => state.integrations.integrationsError;

export const selectLeadSources = (state: RootState) => state.integrations.leadSources;
export const selectLeadSourcesStatus = (state: RootState) => state.integrations.leadSourcesStatus;
export const selectLeadSourcesError = (state: RootState) => state.integrations.leadSourcesError;

export const selectConnectStatus = (state: RootState) => state.integrations.connectStatus;
export const selectConnectError = (state: RootState) => state.integrations.connectError;

export const selectWebhookEvents = (state: RootState) => state.integrations.webhookEvents;
export const selectWebhookEventsStatus = (state: RootState) => state.integrations.webhookEventsStatus;
export const selectWebhookEventsError = (state: RootState) => state.integrations.webhookEventsError;

export const selectImportAttempts = (state: RootState) => state.integrations.importAttempts;
export const selectImportAttemptsStatus = (state: RootState) => state.integrations.importAttemptsStatus;
export const selectImportAttemptsError = (state: RootState) => state.integrations.importAttemptsError;

export const selectResyncStatus = (state: RootState) => state.integrations.resyncStatus;

export const selectFieldMappings = (state: RootState) => state.integrations.fieldMappings;
export const selectFieldMappingsStatus = (state: RootState) => state.integrations.fieldMappingsStatus;
export const selectFieldMappingsError = (state: RootState) => state.integrations.fieldMappingsError;

export const selectSaveFieldMappingStatus = (state: RootState) => state.integrations.saveFieldMappingStatus;
export const selectSaveFieldMappingError = (state: RootState) => state.integrations.saveFieldMappingError;
