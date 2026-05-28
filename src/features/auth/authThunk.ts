import { createAsyncThunk } from "@reduxjs/toolkit";
import authApi from "../../api/authApi";

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await authApi.login(email, password);
      return response.data;
    } catch (error: any) {
      console.error("Login issue:", error.response.data);
      return rejectWithValue(error?.response?.data || "Something went wrong");
    }
  },
);
