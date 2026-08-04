import type { TaxProfile } from "@/lib/tax-profiles";

export type { TaxProfile };

export interface TaxProfilePayload {
  name: string;
  displayName: string;
  description?: string;
  ratePercent: number;
}
