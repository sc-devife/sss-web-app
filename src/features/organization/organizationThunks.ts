import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { Organization, UpdateOrganizationPayload } from "@/features/organization/types";

export const fetchMyOrganization = createAsyncThunk<Organization, void, { rejectValue: string }>(
  "organization/fetchMyOrganization",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<Organization>("/organizations/mine");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load organization"));
    }
  },
);

export const updateOrganization = createAsyncThunk<void, UpdateOrganizationPayload, { rejectValue: string }>(
  "organization/updateOrganization",
  async (payload, { rejectWithValue }) => {
    try {
      await clientApi.put("/organizations", payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save organization"));
    }
  },
);

export const uploadOrganizationLogo = createAsyncThunk<string, File, { rejectValue: string }>(
  "organization/uploadOrganizationLogo",
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await clientApi.postForm<{ url: string }>("/files/upload", formData);
      return res.data.url;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Upload failed"));
    }
  },
);
