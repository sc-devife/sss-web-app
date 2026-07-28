import { backendJson } from "@/lib/backend";

export interface QuoteTemplate {
  id: string;
  name: string;
  description: string;
  layoutFamily: "classic" | "modern" | "minimal";
  accentColor: string;
}

export async function getQuoteTemplates(): Promise<QuoteTemplate[]> {
  return backendJson<QuoteTemplate[]>("/api/quote-templates");
}
