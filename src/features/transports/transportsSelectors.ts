import type { RootState } from "@/store/store";

export const selectTransports = (state: RootState) => state.transports.items;
export const selectTransportsStatus = (state: RootState) => state.transports.status;
export const selectTransportsError = (state: RootState) => state.transports.error;
export const selectTransportSaveStatus = (state: RootState) => state.transports.saveStatus;
export const selectTransportSaveError = (state: RootState) => state.transports.saveError;
