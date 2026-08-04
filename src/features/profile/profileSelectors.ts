import type { RootState } from "@/store/store";

export const selectMyProfile = (state: RootState) => state.profile.profile;
export const selectMyProfileStatus = (state: RootState) => state.profile.status;
export const selectMyProfileError = (state: RootState) => state.profile.error;
export const selectMyProfileUpdateStatus = (state: RootState) => state.profile.updateStatus;
export const selectMyProfileUpdateError = (state: RootState) => state.profile.updateError;
