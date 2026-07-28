import { backendJson } from "@/lib/backend";

export interface TaxProfile {
  uid: string;
  name: string;
  displayName: string;
  description: string | null;
  ratePercent: number;
  status: string;
}

export async function getTaxProfiles(): Promise<TaxProfile[]> {
  return backendJson<TaxProfile[]>("/api/tax-profiles");
}
