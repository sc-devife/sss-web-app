import type { RootState } from "@/store/store";

export const selectRoomTypes = (state: RootState) => state.roomTypes.items;
export const selectRoomTypesStatus = (state: RootState) => state.roomTypes.status;
export const selectRoomTypesError = (state: RootState) => state.roomTypes.error;
