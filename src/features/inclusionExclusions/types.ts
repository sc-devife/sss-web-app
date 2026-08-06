import type { InclusionExclusionItem, InclusionExclusionType } from "@/lib/inclusion-exclusions";

export type { InclusionExclusionItem, InclusionExclusionType };

export interface InclusionExclusionPayload {
  name: string;
  type: InclusionExclusionType;
  contentHtml: string;
  escapePointId: string | null;
}

export interface UpdateInclusionExclusionPayload {
  uid: string;
  payload: InclusionExclusionPayload;
}

export interface FetchSelectableArgs {
  itineraryUid: string;
  type: InclusionExclusionType;
}
