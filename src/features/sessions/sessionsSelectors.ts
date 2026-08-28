import type { RootState } from "@/store/store";

export const selectMySessions = (state: RootState) => state.sessions.items;
export const selectMySessionsStatus = (state: RootState) => state.sessions.status;
export const selectMySessionsError = (state: RootState) => state.sessions.error;
