import type { Deal } from "@/lib/deals";

export type { Deal };

export interface AcceptQuotePayload {
  quoteUid: string;
  escapeId: number;
}
