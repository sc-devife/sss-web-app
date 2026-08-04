import type { RootState } from "@/store/store";

export const selectTaxProfiles = (state: RootState) => state.taxProfiles.items;
export const selectTaxProfilesStatus = (state: RootState) => state.taxProfiles.status;
export const selectTaxProfilesError = (state: RootState) => state.taxProfiles.error;
export const selectTaxProfileSaveStatus = (state: RootState) => state.taxProfiles.saveStatus;
export const selectTaxProfileSaveError = (state: RootState) => state.taxProfiles.saveError;
export const selectTaxProfileDeactivateStatus = (state: RootState) => state.taxProfiles.deactivateStatus;
export const selectTaxProfileDeactivateError = (state: RootState) => state.taxProfiles.deactivateError;
