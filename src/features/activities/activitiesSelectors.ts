import type { RootState } from "@/store/store";

export const selectActivities = (state: RootState) => state.activities.items;
export const selectActivitiesStatus = (state: RootState) => state.activities.status;
export const selectActivitiesError = (state: RootState) => state.activities.error;
export const selectActivitySaveStatus = (state: RootState) => state.activities.saveStatus;
export const selectActivitySaveError = (state: RootState) => state.activities.saveError;
