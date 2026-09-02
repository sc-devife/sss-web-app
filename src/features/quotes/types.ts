import type { Quote } from "@/lib/quotes";
import type { SupportedCurrency } from "@/lib/currencies";

export type { Quote, SupportedCurrency };

export interface CreateQuotePayload {
  itineraryUid: string;
  name?: string;
  validUntil: string | null;
}

export interface RenameQuotePayload {
  uid: string;
  itineraryUid: string;
  name: string;
}

export interface SetQuoteTemplatePayload {
  uid: string;
  itineraryUid: string;
  templateId: string | null;
}

export interface ComputeQuotePayload {
  uid: string;
  itineraryUid: string;
  taxProfileUid: string | null;
  discountType: string;
  discountValue: number | null;
  displayCurrencyCode: string | null;
  fxRateSnapshot: number | null;
}

export interface PricingBreakdown {
  hotelsInr: number;
  activitiesInr: number;
  transportInr: number;
  otherInr: number;
}

export interface ComputeQuoteResult {
  pricingWarnings: string[];
  breakdown: PricingBreakdown | null;
}

export interface QuoteUidWithItinerary {
  uid: string;
  itineraryUid: string;
}
