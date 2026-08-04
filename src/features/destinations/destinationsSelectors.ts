import type { RootState } from "@/store/store";

export const selectDestinations = (state: RootState) => state.destinations.items;
export const selectDestinationsStatus = (state: RootState) => state.destinations.status;
export const selectDestinationsError = (state: RootState) => state.destinations.error;
export const selectDestinationSaveStatus = (state: RootState) => state.destinations.saveStatus;
export const selectDestinationSaveError = (state: RootState) => state.destinations.saveError;
