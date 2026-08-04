import { createSlice } from "@reduxjs/toolkit";
import type { MyProfile } from "@/features/profile/types";
import { fetchMyProfile, updateMyProfile } from "@/features/profile/profileThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface ProfileState {
  profile: MyProfile | null;
  status: RequestStatus;
  error: string | null;

  updateStatus: RequestStatus;
  updateError: string | null;
}

const initialState: ProfileState = {
  profile: null,
  status: "idle",
  error: null,
  updateStatus: "idle",
  updateError: null,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    resetUpdateStatus(state) {
      state.updateStatus = "idle";
      state.updateError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyProfile.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMyProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.profile = action.payload;
      })
      .addCase(fetchMyProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load profile";
      })

      .addCase(updateMyProfile.pending, (state) => {
        state.updateStatus = "loading";
        state.updateError = null;
      })
      .addCase(updateMyProfile.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        state.profile = action.payload;
      })
      .addCase(updateMyProfile.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.updateError = action.payload ?? "Failed to update profile";
      });
  },
});

export const { resetUpdateStatus } = profileSlice.actions;
export default profileSlice.reducer;
