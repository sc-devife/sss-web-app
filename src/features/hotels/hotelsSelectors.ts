import type { RootState } from "@/store/store";

export const selectHotels = (state: RootState) => state.hotels.items;
export const selectHotelsStatus = (state: RootState) => state.hotels.status;
export const selectHotelsError = (state: RootState) => state.hotels.error;
export const selectHotelSaveStatus = (state: RootState) => state.hotels.saveStatus;
export const selectHotelSaveError = (state: RootState) => state.hotels.saveError;
