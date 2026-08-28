import { createSlice } from "@reduxjs/toolkit";
import type { Organization } from "@/features/organization/types";
import { fetchMyOrganization, updateOrganization, updateOrganizationSettings, uploadOrganizationLogo } from "@/features/organization/organizationThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface OrganizationState {
  current: Organization | null;
  status: RequestStatus;
  error: string | null;

  saveStatus: RequestStatus;
  saveError: string | null;

  settingsSaveStatus: RequestStatus;
  settingsSaveError: string | null;

  logoUploadStatus: RequestStatus;
  logoUploadError: string | null;
}

const initialState: OrganizationState = {
  current: null,
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
  settingsSaveStatus: "idle",
  settingsSaveError: null,
  logoUploadStatus: "idle",
  logoUploadError: null,
};

const organizationSlice = createSlice({
  name: "organization",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
    resetLogoUploadStatus(state) {
      state.logoUploadStatus = "idle";
      state.logoUploadError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyOrganization.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMyOrganization.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.current = action.payload;
      })
      .addCase(fetchMyOrganization.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load organization";
      })

      .addCase(updateOrganization.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(updateOrganization.fulfilled, (state) => {
        state.saveStatus = "succeeded";
      })
      .addCase(updateOrganization.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to save organization";
      })

      .addCase(updateOrganizationSettings.pending, (state) => {
        state.settingsSaveStatus = "loading";
        state.settingsSaveError = null;
      })
      .addCase(updateOrganizationSettings.fulfilled, (state, action) => {
        state.settingsSaveStatus = "succeeded";
        if (state.current) {
          state.current.settings = action.payload;
        }
      })
      .addCase(updateOrganizationSettings.rejected, (state, action) => {
        state.settingsSaveStatus = "failed";
        state.settingsSaveError = action.payload ?? "Failed to save settings";
      })

      .addCase(uploadOrganizationLogo.pending, (state) => {
        state.logoUploadStatus = "loading";
        state.logoUploadError = null;
      })
      .addCase(uploadOrganizationLogo.fulfilled, (state) => {
        state.logoUploadStatus = "succeeded";
      })
      .addCase(uploadOrganizationLogo.rejected, (state, action) => {
        state.logoUploadStatus = "failed";
        state.logoUploadError = action.payload ?? "Upload failed";
      });
  },
});

export const { resetSaveStatus, resetLogoUploadStatus } = organizationSlice.actions;
export default organizationSlice.reducer;
