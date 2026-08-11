import { createSlice } from "@reduxjs/toolkit";
import type { ItineraryItem } from "@/features/itineraryItems/types";
import {
  fetchItineraryItems,
  createItineraryItem,
  updateItineraryItem,
  deleteItineraryItem,
  reorderItineraryItems,
} from "@/features/itineraryItems/itineraryItemsThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface ItineraryItemsState {
  itemsByItinerary: Record<string, ItineraryItem[]>;
  statusByItinerary: Record<string, RequestStatus>;
  errorByItinerary: Record<string, string | null>;

  saveStatus: RequestStatus;
  saveError: string | null;

  updateStatus: RequestStatus;
  updateError: string | null;

  deleteStatus: RequestStatus;
  deleteError: string | null;

  reorderStatus: RequestStatus;
  reorderError: string | null;
}

const initialState: ItineraryItemsState = {
  itemsByItinerary: {},
  statusByItinerary: {},
  errorByItinerary: {},
  saveStatus: "idle",
  saveError: null,
  updateStatus: "idle",
  updateError: null,
  deleteStatus: "idle",
  deleteError: null,
  reorderStatus: "idle",
  reorderError: null,
};

const itineraryItemsSlice = createSlice({
  name: "itineraryItems",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItineraryItems.pending, (state, action) => {
        state.statusByItinerary[action.meta.arg] = "loading";
        state.errorByItinerary[action.meta.arg] = null;
      })
      .addCase(fetchItineraryItems.fulfilled, (state, action) => {
        state.statusByItinerary[action.payload.itineraryUid] = "succeeded";
        state.itemsByItinerary[action.payload.itineraryUid] = action.payload.items;
      })
      .addCase(fetchItineraryItems.rejected, (state, action) => {
        state.statusByItinerary[action.meta.arg] = "failed";
        state.errorByItinerary[action.meta.arg] = action.payload ?? "Failed to load itinerary items";
      })

      .addCase(createItineraryItem.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(createItineraryItem.fulfilled, (state) => {
        state.saveStatus = "succeeded";
      })
      .addCase(createItineraryItem.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to add item";
      })

      .addCase(updateItineraryItem.pending, (state) => {
        state.updateStatus = "loading";
        state.updateError = null;
      })
      .addCase(updateItineraryItem.fulfilled, (state) => {
        state.updateStatus = "succeeded";
      })
      .addCase(updateItineraryItem.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.updateError = action.payload ?? "Failed to update item";
      })

      .addCase(deleteItineraryItem.pending, (state) => {
        state.deleteStatus = "loading";
        state.deleteError = null;
      })
      .addCase(deleteItineraryItem.fulfilled, (state) => {
        state.deleteStatus = "succeeded";
      })
      .addCase(deleteItineraryItem.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload ?? "Failed to remove item";
      })

      .addCase(reorderItineraryItems.pending, (state) => {
        state.reorderStatus = "loading";
        state.reorderError = null;
      })
      .addCase(reorderItineraryItems.fulfilled, (state) => {
        state.reorderStatus = "succeeded";
      })
      .addCase(reorderItineraryItems.rejected, (state, action) => {
        state.reorderStatus = "failed";
        state.reorderError = action.payload ?? "Failed to reorder items";
      });
  },
});

export const { resetSaveStatus } = itineraryItemsSlice.actions;
export default itineraryItemsSlice.reducer;
