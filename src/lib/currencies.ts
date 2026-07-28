import { backendJson } from "@/lib/backend";

export interface SupportedCurrency {
  code: string;
  name: string;
  symbol: string;
  is_active: boolean;
}

export async function getSupportedCurrencies(): Promise<SupportedCurrency[]> {
  return backendJson<SupportedCurrency[]>("/system/currencies");
}
