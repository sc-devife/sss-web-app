import type { RootState } from "@/store/store";
import type { ItineraryContentItem } from "@/features/itineraryContentItems/types";

const EMPTY_ITEMS: ItineraryContentItem[] = [];

export const selectItineraryContentItems = (state: RootState, itineraryUid: string) =>
  state.itineraryContentItems.itemsByItinerary[itineraryUid] ?? EMPTY_ITEMS;

export const selectItineraryContentItemsStatus = (state: RootState, itineraryUid: string) =>
  state.itineraryContentItems.statusByItinerary[itineraryUid] ?? "idle";

export const selectItineraryContentItemsError = (state: RootState, itineraryUid: string) =>
  state.itineraryContentItems.errorByItinerary[itineraryUid] ?? null;

export const selectItineraryContentItemSaveStatus = (state: RootState) => state.itineraryContentItems.saveStatus;
export const selectItineraryContentItemSaveError = (state: RootState) => state.itineraryContentItems.saveError;
