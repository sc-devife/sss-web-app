import type { ItineraryContentItem } from "@/lib/itinerary-content-items";
import type { InclusionExclusionType } from "@/lib/inclusion-exclusions";

export type { ItineraryContentItem };

export interface AttachItineraryContentItemPayload {
  itineraryUid: string;
  sourceItemUid: string;
}

export interface CreateItineraryContentItemPayload {
  itineraryUid: string;
  type: InclusionExclusionType;
  name: string;
  contentHtml: string;
}

export interface UpdateItineraryContentItemPayload {
  uid: string;
  itineraryUid: string;
  name: string;
  contentHtml: string;
}

export interface DeleteItineraryContentItemPayload {
  uid: string;
  itineraryUid: string;
}
