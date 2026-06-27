import { createAsyncThunk } from "@reduxjs/toolkit";
import authApi from "../../api/authApi";
import storageService from "../../services/localStorage";
import AppToast from "../../services/toastService";

export const restoreUser = createAsyncThunk<
  string,
  void,
  { rejectValue: string }
>(
  "auth/restoreUser",
  async (_, { rejectWithValue }) => {
    const token = storageService.getItem<string>("token");

    if (!token) {
      return rejectWithValue("No user data found");
    }

    return token;
  }
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await authApi.login(email, password);
      storageService.setItem("token", response.data.token);
      return response.data;
    } catch (error: any) {
      console.error("Login issue:", error.response.data);
      return rejectWithValue(error?.response?.data || "Something went wrong");
    }
  },
);

export const signupUser = createAsyncThunk(
  "auth/SignupUser",
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await authApi.signup(data);
      return response.data;
    } catch (error: any) {
      console.error("Signup issue:", error.response.data.message);
      AppToast.showError(error.response.data.message);
      return rejectWithValue(error?.response?.data || "Something went wrong");
    }
  },
);