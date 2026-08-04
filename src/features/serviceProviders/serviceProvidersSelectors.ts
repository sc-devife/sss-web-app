import type { RootState } from "@/store/store";

export const selectServiceProviders = (state: RootState) => state.serviceProviders.items;
export const selectServiceProvidersStatus = (state: RootState) => state.serviceProviders.status;
export const selectServiceProvidersError = (state: RootState) => state.serviceProviders.error;
export const selectServiceProviderSaveStatus = (state: RootState) => state.serviceProviders.saveStatus;
export const selectServiceProviderSaveError = (state: RootState) => state.serviceProviders.saveError;
