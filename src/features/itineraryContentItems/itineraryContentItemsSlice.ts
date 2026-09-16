import { createSlice } from "@reduxjs/toolkit";
import type { ItineraryContentItem } from "@/features/itineraryContentItems/types";
import {
  fetchItineraryContentItems,
  attachItineraryContentItem,
  createItineraryContentItem,
  updateItineraryContentItem,
  deleteItineraryContentItem,
  reorderItineraryContentItems,
} from "@/features/itineraryContentItems/itineraryContentItemsThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface ItineraryContentItemsState {
  itemsByItinerary: Record<string, ItineraryContentItem[]>;
  statusByItinerary: Record<string, RequestStatus>;
  errorByItinerary: Record<string, string | null>;

  saveStatus: RequestStatus;
  saveError: string | null;

  deleteStatus: RequestStatus;
  deleteError: string | null;

  reorderStatus: RequestStatus;
  reorderError: string | null;
}

const initialState: ItineraryContentItemsState = {
  itemsByItinerary: {},
  statusByItinerary: {},
  errorByItinerary: {},
  saveStatus: "idle",
  saveError: null,
  deleteStatus: "idle",
  deleteError: null,
  reorderStatus: "idle",
  reorderError: null,
};

const itineraryContentItemsSlice = createSlice({
  name: "itineraryContentItems",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItineraryContentItems.pending, (state, action) => {
        state.statusByItinerary[action.meta.arg] = "loading";
        state.errorByItinerary[action.meta.arg] = null;
      })
      .addCase(fetchItineraryContentItems.fulfilled, (state, action) => {
        state.statusByItinerary[action.payload.itineraryUid] = "succeeded";
        state.itemsByItinerary[action.payload.itineraryUid] = action.payload.items;
      })
      .addCase(fetchItineraryContentItems.rejected, (state, action) => {
        state.statusByItinerary[action.meta.arg] = "failed";
        state.errorByItinerary[action.meta.arg] = action.payload ?? "Failed to load content items";
      })

      .addCase(attachItineraryContentItem.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(attachItineraryContentItem.fulfilled, (state) => {
        state.saveStatus = "succeeded";
      })
      .addCase(attachItineraryContentItem.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to attach";
      })

      .addCase(createItineraryContentItem.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(createItineraryContentItem.fulfilled, (state) => {
        state.saveStatus = "succeeded";
      })
      .addCase(createItineraryContentItem.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to add";
      })

      .addCase(updateItineraryContentItem.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(updateItineraryContentItem.fulfilled, (state) => {
        state.saveStatus = "succeeded";
      })
      .addCase(updateItineraryContentItem.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to save";
      })

      .addCase(deleteItineraryContentItem.pending, (state) => {
        state.deleteStatus = "loading";
        state.deleteError = null;
      })
      .addCase(deleteItineraryContentItem.fulfilled, (state) => {
        state.deleteStatus = "succeeded";
      })
      .addCase(deleteItineraryContentItem.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload ?? "Failed to remove";
      })

      .addCase(reorderItineraryContentItems.pending, (state) => {
        state.reorderStatus = "loading";
        state.reorderError = null;
      })
      .addCase(reorderItineraryContentItems.fulfilled, (state) => {
        state.reorderStatus = "succeeded";
      })
      .addCase(reorderItineraryContentItems.rejected, (state, action) => {
        state.reorderStatus = "failed";
        state.reorderError = action.payload ?? "Failed to reorder items";
      });
  },
});

export const { resetSaveStatus } = itineraryContentItemsSlice.actions;
export default itineraryContentItemsSlice.reducer;
