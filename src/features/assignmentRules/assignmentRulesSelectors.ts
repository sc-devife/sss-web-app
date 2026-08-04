import type { RootState } from "@/store/store";

export const selectPriorityCalendarEntries = (state: RootState) => state.assignmentRules.items;
export const selectPriorityCalendarStatus = (state: RootState) => state.assignmentRules.status;
export const selectPriorityCalendarError = (state: RootState) => state.assignmentRules.error;
export const selectPriorityCalendarSaveStatus = (state: RootState) => state.assignmentRules.saveStatus;
export const selectPriorityCalendarSaveError = (state: RootState) => state.assignmentRules.saveError;
export const selectToggleAutoAssignStatus = (state: RootState) => state.assignmentRules.toggleStatus;
export const selectToggleAutoAssignError = (state: RootState) => state.assignmentRules.toggleError;
