import type { RootState } from "@/store/store";
import type { ItineraryItem } from "@/features/itineraryItems/types";

const EMPTY_ITEMS: ItineraryItem[] = [];

export const selectItineraryItems = (state: RootState, itineraryUid: string) =>
  state.itineraryItems.itemsByItinerary[itineraryUid] ?? EMPTY_ITEMS;

export const selectItineraryItemsStatus = (state: RootState, itineraryUid: string) =>
  state.itineraryItems.statusByItinerary[itineraryUid] ?? "idle";

export const selectItineraryItemsError = (state: RootState, itineraryUid: string) =>
  state.itineraryItems.errorByItinerary[itineraryUid] ?? null;

export const selectItineraryItemSaveStatus = (state: RootState) => state.itineraryItems.saveStatus;
export const selectItineraryItemSaveError = (state: RootState) => state.itineraryItems.saveError;
