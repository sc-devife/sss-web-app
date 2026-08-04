import { createSlice } from "@reduxjs/toolkit";
import type { ItineraryContentItem } from "@/features/itineraryContentItems/types";
import {
  fetchItineraryContentItems,
  attachItineraryContentItem,
  createItineraryContentItem,
  updateItineraryContentItem,
  deleteItineraryContentItem,
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
}

const initialState: ItineraryContentItemsState = {
  itemsByItinerary: {},
  statusByItinerary: {},
  errorByItinerary: {},
  saveStatus: "idle",
  saveError: null,
  deleteStatus: "idle",
  deleteError: null,
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
      });
  },
});

export const { resetSaveStatus } = itineraryContentItemsSlice.actions;
export default itineraryContentItemsSlice.reducer;
