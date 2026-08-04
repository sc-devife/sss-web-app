import type { RootState } from "@/store/store";

export const selectOrganization = (state: RootState) => state.organization.current;
export const selectOrganizationStatus = (state: RootState) => state.organization.status;
export const selectOrganizationError = (state: RootState) => state.organization.error;
export const selectOrganizationSaveStatus = (state: RootState) => state.organization.saveStatus;
export const selectOrganizationSaveError = (state: RootState) => state.organization.saveError;
export const selectOrganizationLogoUploadStatus = (state: RootState) => state.organization.logoUploadStatus;
export const selectOrganizationLogoUploadError = (state: RootState) => state.organization.logoUploadError;
