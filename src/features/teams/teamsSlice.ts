import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import type { Team } from "@/features/teams/types";
import { fetchTeams, createTeam, updateTeam, deleteTeam } from "@/features/teams/teamsThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface TeamsState {
  items: Team[];
  status: RequestStatus;
  error: string | null;

  saveStatus: RequestStatus;
  saveError: string | null;

  deleteStatus: RequestStatus;
  deleteError: string | null;
}

const initialState: TeamsState = {
  items: [],
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
  deleteStatus: "idle",
  deleteError: null,
};

const teamsSlice = createSlice({
  name: "teams",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeams.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load teams";
      })

      .addCase(deleteTeam.pending, (state) => {
        state.deleteStatus = "loading";
        state.deleteError = null;
      })
      .addCase(deleteTeam.fulfilled, (state) => {
        state.deleteStatus = "succeeded";
      })
      .addCase(deleteTeam.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload ?? "Failed to deactivate team";
      })

      .addMatcher(isAnyOf(createTeam.pending, updateTeam.pending), (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addMatcher(isAnyOf(createTeam.fulfilled, updateTeam.fulfilled), (state) => {
        state.saveStatus = "succeeded";
      })
      .addMatcher(isAnyOf(createTeam.rejected, updateTeam.rejected), (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to save team";
      });
  },
});

export const { resetSaveStatus } = teamsSlice.actions;
export default teamsSlice.reducer;
