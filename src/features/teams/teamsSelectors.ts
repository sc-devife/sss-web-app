import type { RootState } from "@/store/store";

export const selectTeams = (state: RootState) => state.teams.items;
export const selectTeamsStatus = (state: RootState) => state.teams.status;
export const selectTeamsError = (state: RootState) => state.teams.error;
export const selectTeamSaveStatus = (state: RootState) => state.teams.saveStatus;
export const selectTeamSaveError = (state: RootState) => state.teams.saveError;
