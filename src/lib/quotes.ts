import { backendJson } from "@/lib/backend";

export interface Quote {
  uid: string;
  itineraryUid: string;
  quoteCode: string | null;
  name: string | null;
  version: number;
  status: string;
  currencyCode: string | null;
  fxRateSnapshot: number | null;
  subtotalInr: number | null;
  taxProfileId: string | null;
  taxAmountInr: number | null;
  tcsRatePercent: number | null;
  tcsAmountInr: number | null;
  totalInr: number | null;
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
