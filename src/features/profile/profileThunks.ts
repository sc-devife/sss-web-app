import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { MyProfile, UpdateMyProfilePayload } from "@/features/profile/types";

export const fetchMyProfile = createAsyncThunk<MyProfile, void, { rejectValue: string }>(
  "profile/fetchMyProfile",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<MyProfile>("/users/me");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load profile"));
    }
  },
);

export const updateMyProfile = createAsyncThunk<MyProfile, UpdateMyProfilePayload, { rejectValue: string }>(
  "profile/updateMyProfile",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await clientApi.put<MyProfile>("/users/me", payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to update profile"));
    }
  },
);
