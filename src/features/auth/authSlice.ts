import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CurrentUser } from "@/lib/current-user";

// Client-side mirror of the current user, seeded from the server-resolved
// value in (protected)/layout.tsx so client components can useSelector it
// instead of prop-drilling. This is NOT the authorization boundary — that's
// still middleware.ts's cookie check + (protected)/layout.tsx's own
// getCurrentUser() call, both untouched. This slice only exists so client
// components have a convenient read of who's logged in.
interface AuthState {
  user: CurrentUser | null;
  roles: string[];
}

const initialState: AuthState = {
  user: null,
  roles: [],
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCurrentUser(state, action: PayloadAction<{ user: CurrentUser; roles: string[] }>) {
      state.user = action.payload.user;
      state.roles = action.payload.roles;
    },
    clearCurrentUser(state) {
      state.user = null;
      state.roles = [];
    },
  },
});

export const { setCurrentUser, clearCurrentUser } = authSlice.actions;
export default authSlice.reducer;
