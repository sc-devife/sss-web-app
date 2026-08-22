import { backendJson } from "@/lib/backend";

export interface Quote {
  uid: string;
  itineraryUid: string;
  name: string | null;
  version: number;
  status: string;
  currencyCode: string | null;
  fxRateSnapshot: number | null;
  subtotalUsd: number | null;
  taxProfileId: string | null;
  taxAmountUsd: number | null;
  totalUsd: number | null;
  discountType: string;
  discountValue: number | null;
  templateId: string | null; // per-quote template override — falls back to the org default when null
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
  createdByName: string | null;
}

export async function getQuotesForItinerary(itineraryUid: string): Promise<Quote[]> {
  return backendJson<Quote[]>(`/api/quotes?itineraryUid=${itineraryUid}`);
}

export async function getQuoteByUid(uid: string): Promise<Quote> {
  return backendJson<Quote>(`/api/quotes/${uid}`);
}
