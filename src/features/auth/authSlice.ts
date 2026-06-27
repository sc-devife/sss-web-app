import { createSlice } from "@reduxjs/toolkit";
import { loginUser, restoreUser, signupUser } from "./authThunk";
import storageService from "../../services/localStorage";

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  token: string | null;
  isAuthenticated: boolean;

  // signup
  signupLoading: boolean;
  signupData: User | null;
  signupError: string | null;
}

const initialState: AuthState = {

  // login
  user: null,
  loading: false,
  error: null,
  token: null,
  isAuthenticated: false,

  // signup
  signupLoading: false,
  signupData: null,
  signupError: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logOutUser: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      storageService.removeItem("token");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data;
        state.token = action.payload.token || null;
        console.log("Token:", state.token);
        console.log("action", action);
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Login failed";
      })

      //restoreUser
      .addCase(restoreUser.fulfilled, (state, action) => {
        state.token = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(restoreUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })


      // signup
      .addCase(signupUser.pending, (state) => {
        state.signupLoading = true;
        state.signupError = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.signupLoading = false;
        state.signupData = action.payload.data;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.signupLoading = false;
        state.signupError = action.error.message || "Signup failed";
      });
  },
});

export const { logOutUser } = authSlice.actions;
export default authSlice.reducer;
