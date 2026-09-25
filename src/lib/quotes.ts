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
  /** The rate was typed on this quote and is pinned (never auto-refreshed). */
  fxRateCustom: boolean | null;
  /** Where the rate came from: market, vendor (Organization settings) or custom (this quote). */
  fxRateSource: "market" | "vendor" | "custom" | null;
  fxRateAsOf: string | null;
  subtotalBase: number | null;
  taxProfileId: string | null;
  // Wins over taxProfileId's own stored rate% when set — a one-off tax % or
  // a tweak to the selected profile's rate.
  taxRatePercentOverride: number | null;
  taxAmountBase: number | null;
  tcsRatePercent: number | null;
  tcsAmountBase: number | null;
  totalBase: number | null;
  discountType: string;
  discountValue: number | null;
  templateId: string | null; // per-quote template override — falls back to the org default when null
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
  createdByName: string | null;
  /** When the quotation was last generated — null if never. */
  generatedAt: string | null;
  /** Generated, but the quote has changed since. */
  changedSinceGenerated: boolean | null;
}

export async function getQuotesForItinerary(itineraryUid: string): Promise<Quote[]> {
  return backendJson<Quote[]>(`/api/quotes?itineraryUid=${itineraryUid}`);
}

export async function getQuoteByUid(uid: string): Promise<Quote> {
  return backendJson<Quote>(`/api/quotes/${uid}`);
}

// One itinerary item's row in a Quote's day-wise breakdown (the Quote tab's
// main list) — see QuoteLineItemResponseDTO. Synced from the itinerary's
// current items server-side every time it's fetched, so `grossAmountBase`
// always reflects the itinerary-planning estimate; `discountType`/
// `discountValue`/`netAmountBase` are this quote's own, independently
// editable per item.
export interface QuoteLineItem {
  uid: string;
  itineraryItemUid: string;
  dayNumber: number;
  itemType: string;
  label: string;
  cancellation: boolean;
  grossAmountBase: number;
  discountType: string;
  discountValue: number | null;
  netAmountBase: number;
}

export interface QuoteLineItemsResult {
  quote: Quote;
  lineItems: QuoteLineItem[];
  pricingWarnings: string[];
}
