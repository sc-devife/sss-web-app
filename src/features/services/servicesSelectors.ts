import type { RootState } from "@/store/store";

export const selectServices = (state: RootState) => state.services.items;
export const selectServicesStatus = (state: RootState) => state.services.status;
export const selectServicesError = (state: RootState) => state.services.error;
