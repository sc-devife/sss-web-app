import type { RootState } from "@/store/store";
import type { InclusionExclusionItem } from "@/features/inclusionExclusions/types";

export const selectInclusionExclusions = (state: RootState) => state.inclusionExclusions.items;
export const selectInclusionExclusionsStatus = (state: RootState) => state.inclusionExclusions.status;
export const selectInclusionExclusionsError = (state: RootState) => state.inclusionExclusions.error;
export const selectInclusionExclusionSaveStatus = (state: RootState) => state.inclusionExclusions.saveStatus;
export const selectInclusionExclusionSaveError = (state: RootState) => state.inclusionExclusions.saveError;

const EMPTY_SELECTABLE: InclusionExclusionItem[] = [];

export const selectSelectableInclusionExclusions = (state: RootState, itineraryUid: string, type: string) =>
  state.inclusionExclusions.selectableByKey[`${itineraryUid}:${type}`] ?? EMPTY_SELECTABLE;

export const selectSelectableInclusionExclusionsStatus = (state: RootState, itineraryUid: string, type: string) =>
  state.inclusionExclusions.selectableStatusByKey[`${itineraryUid}:${type}`] ?? "idle";
