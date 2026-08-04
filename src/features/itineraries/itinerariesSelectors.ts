import type { RootState } from "@/store/store";

export const selectItineraries = (state: RootState) => state.itineraries.items;
export const selectItinerariesStatus = (state: RootState) => state.itineraries.status;
export const selectItinerariesError = (state: RootState) => state.itineraries.error;
export const selectItinerarySaveStatus = (state: RootState) => state.itineraries.saveStatus;
export const selectItinerarySaveError = (state: RootState) => state.itineraries.saveError;
