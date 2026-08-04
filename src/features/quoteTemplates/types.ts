import type { QuoteTemplate } from "@/lib/quote-templates";

export type { QuoteTemplate };

export interface SetDefaultQuoteTemplatePayload {
  organizationUid: string;
  templateId: string;
}
