import type { RootState } from "@/store/store";

export const selectEscapePoints = (state: RootState) => state.escapePoints.items;
export const selectEscapePointsStatus = (state: RootState) => state.escapePoints.status;
export const selectEscapePointsError = (state: RootState) => state.escapePoints.error;
export const selectEscapePointSaveStatus = (state: RootState) => state.escapePoints.saveStatus;
export const selectEscapePointSaveError = (state: RootState) => state.escapePoints.saveError;
