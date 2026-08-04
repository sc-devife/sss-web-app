import type { RootState } from "@/store/store";

export const selectReminderRules = (state: RootState) => state.reminderRules.items;
export const selectReminderRulesStatus = (state: RootState) => state.reminderRules.status;
export const selectReminderRulesError = (state: RootState) => state.reminderRules.error;
export const selectReminderRuleSaveStatus = (state: RootState) => state.reminderRules.saveStatus;
export const selectReminderRuleSaveError = (state: RootState) => state.reminderRules.saveError;
export const selectReminderRuleDeleteStatus = (state: RootState) => state.reminderRules.deleteStatus;
export const selectReminderRuleDeleteError = (state: RootState) => state.reminderRules.deleteError;
