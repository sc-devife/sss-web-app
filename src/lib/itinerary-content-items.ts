import { backendJson } from "@/lib/backend";

export interface ItineraryContentItem {
  uid: string;
  itineraryUid: string;
  type: "INCLUSION" | "EXCLUSION" | "TERMS";
  sourceItemId: number | null;
  name: string;
  contentHtml: string | null;
  sortOrder: number;
}

export async function getItineraryContentItems(itineraryUid: string): Promise<ItineraryContentItem[]> {
  return backendJson<ItineraryContentItem[]>(`/api/itinerary-content-items?itineraryUid=${itineraryUid}`);
}
