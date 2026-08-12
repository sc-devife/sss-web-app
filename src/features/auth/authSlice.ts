import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Single source of truth for the logged-in user's identity — populated from
// the login response on sign-in, and re-derived from the server-resolved
// current user (see AuthHydrator) on every protected-page load/refresh, so
// the Header keeps working after a refresh without ever touching
// localStorage. This is NOT the authorization boundary — that's still
// middleware.ts's cookie check + (protected)/layout.tsx's own
// getCurrentUser() call, both untouched.
export interface LoggedInUser {
  userId: string;
  name: string;
  // Populated from AuthHydrator's server-resolved current user; absent on
  // the initial optimistic set from the login response (see login/page.tsx).
  firstName?: string;
  lastName?: string;
  role: string;
  organizationLogo: string | null;
  profilePicture?: string | null;
}

interface AuthState {
  user: LoggedInUser | null;
}

const initialState: AuthState = {
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoggedInUser(state, action: PayloadAction<LoggedInUser>) {
      state.user = action.payload;
    },
    clearLoggedInUser(state) {
      state.user = null;
    },
  },
});

export const { setLoggedInUser, clearLoggedInUser } = authSlice.actions;
export default authSlice.reducer;
