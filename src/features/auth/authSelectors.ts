import type { RootState } from "@/store/store";

export const selectLoggedInUser = (state: RootState) => state.auth.user;
