import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import type { Hotel } from "@/features/hotels/types";
import { fetchHotels, createHotel, updateHotel, deleteHotel } from "@/features/hotels/hotelsThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface HotelsState {
  items: Hotel[];
  status: RequestStatus;
  error: string | null;

  saveStatus: RequestStatus;
  saveError: string | null;

  deleteStatus: RequestStatus;
  deleteError: string | null;
}

const initialState: HotelsState = {
  items: [],
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
  deleteStatus: "idle",
  deleteError: null,
};

const hotelsSlice = createSlice({
  name: "hotels",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotels.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchHotels.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchHotels.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load hotels";
      })

      .addCase(deleteHotel.pending, (state) => {
        state.deleteStatus = "loading";
        state.deleteError = null;
      })
      .addCase(deleteHotel.fulfilled, (state) => {
        state.deleteStatus = "succeeded";
      })
      .addCase(deleteHotel.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload ?? "Failed to archive hotel";
      })

      .addMatcher(isAnyOf(createHotel.pending, updateHotel.pending), (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addMatcher(isAnyOf(createHotel.fulfilled, updateHotel.fulfilled), (state) => {
        state.saveStatus = "succeeded";
      })
      .addMatcher(isAnyOf(createHotel.rejected, updateHotel.rejected), (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to save hotel";
      });
  },
});

export const { resetSaveStatus } = hotelsSlice.actions;
export default hotelsSlice.reducer;
