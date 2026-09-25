export interface OrgExchangeRateRow {
  currencyCode: string;
  currencyName: string;
  /** Market rate: 1 base currency = marketRate of this currency. Null when unavailable. */
  marketRate: number | null;
  /** The vendor's own rate, kept even while switched back to market. */
  manualRate: number | null;
  manual: boolean;
  /** What applies now: the manual rate while manual, otherwise the market rate. */
  effectiveRate: number | null;
  asOf: string | null;
}

export interface ResolvedExchangeRate {
  from: string;
  to: string;
  rate: number;
  source: "market" | "manual" | "same";
  manual: boolean;
  asOf: string | null;
  marketRate: number | null;
}

// Rates are tiny or huge depending on the pair (1 AED = 25.98 INR, 1 INR =
// 0.0385 AED), so show enough significant digits without trailing noise.
export function formatRate(rate: number | null | undefined): string {
  if (rate == null || Number.isNaN(rate)) return "—";
  const digits = rate >= 100 ? 2 : rate >= 1 ? 4 : 6;
  return Number(rate.toFixed(digits)).toString();
}
