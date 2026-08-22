import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import type { RoomType } from "@/features/roomTypes/types";
import { fetchRoomTypes, createRoomType, updateRoomType, deleteRoomType } from "@/features/roomTypes/roomTypesThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface RoomTypesState {
  items: RoomType[];
  status: RequestStatus;
  error: string | null;

  saveStatus: RequestStatus;
  saveError: string | null;

  deleteStatus: RequestStatus;
  deleteError: string | null;
}

const initialState: RoomTypesState = {
  items: [],
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
  deleteStatus: "idle",
  deleteError: null,
};

const roomTypesSlice = createSlice({
  name: "roomTypes",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoomTypes.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchRoomTypes.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchRoomTypes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load room types";
      })

      .addCase(deleteRoomType.pending, (state) => {
        state.deleteStatus = "loading";
        state.deleteError = null;
      })
      .addCase(deleteRoomType.fulfilled, (state) => {
        state.deleteStatus = "succeeded";
      })
      .addCase(deleteRoomType.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload ?? "Failed to delete room type";
      })

      .addMatcher(isAnyOf(createRoomType.pending, updateRoomType.pending), (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addMatcher(isAnyOf(createRoomType.fulfilled, updateRoomType.fulfilled), (state) => {
        state.saveStatus = "succeeded";
      })
      .addMatcher(isAnyOf(createRoomType.rejected, updateRoomType.rejected), (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to save room type";
      });
  },
});

export const { resetSaveStatus } = roomTypesSlice.actions;
export default roomTypesSlice.reducer;
