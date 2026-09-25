// Currency-aware money formatting for every amount in the app.
//
// Amounts stored on records (Quote.totalBase, PaymentMilestone.amountBase, ...)
// are in the vendor's *base currency* — INR for every vendor until a vendor
// picks another under Organization settings. The base currency and the
// vendor's rounding preference are loaded once per session (AuthHydrator ->
// setOrgCurrency) and used as the default here, so call sites just write
// formatMoney(amount). Pass an explicit currency code for an amount that is
// in some other currency (e.g. a quote issued in the traveller's currency).
//
// Rounding is a display preference only: "whole" shows no decimals, it does
// not change the stored value.

export type RoundingMode = "decimals" | "whole";

const DEFAULT_CURRENCY = "INR";

let orgCurrency = DEFAULT_CURRENCY;
let orgRounding: RoundingMode = "decimals";

export function setOrgCurrency(currencyCode: string | null | undefined, roundingMode: string | null | undefined): void {
  orgCurrency = currencyCode || DEFAULT_CURRENCY;
  orgRounding = roundingMode === "whole" ? "whole" : "decimals";
}

export function getOrgCurrency(): string {
  return orgCurrency;
}

// en-IN gives real Indian digit grouping (1,23,456.00) for INR; everything
// else uses standard grouping.
function localeFor(currency: string): string {
  return currency === "INR" ? "en-IN" : "en-US";
}

export function formatMoney(value: number | null | undefined, currency: string = orgCurrency): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(localeFor(currency), {
    style: "currency",
    currency,
    // Omitting the digit options lets Intl use the currency's own minor units
    // (2 for INR/AED, 0 for JPY, 3 for KWD); "whole" forces none.
    ...(orgRounding === "whole" ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
  }).format(value);
}

// Formats with an explicit rounding mode, independent of the loaded vendor
// setting - for previews (e.g. the rounding option labels in settings).
export function previewMoney(value: number, currency: string, mode: RoundingMode): string {
  return new Intl.NumberFormat(localeFor(currency), {
    style: "currency",
    currency,
    ...(mode === "whole" ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
  }).format(value);
}

// Compact form for tight chart labels/tooltips — "₹12.4K" instead of "₹12,400.00".
export function formatMoneyCompact(value: number | null | undefined, currency: string = orgCurrency): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(localeFor(currency), {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

// A payment made in a foreign currency: "AED 1,000.00 (≈ ₹27,000.00)"; a
// base-currency payment is just the base amount.
export function formatMoneyWithOriginal(
  baseAmount: number,
  paidAmount: number | null | undefined,
  paidCurrency: string | null | undefined,
): string {
  if (paidAmount == null || !paidCurrency) return formatMoney(baseAmount);
  return `${formatMoney(paidAmount, paidCurrency)} (≈ ${formatMoney(baseAmount)})`;
}

// Decimal places (ISO 4217 minor units) a currency uses: 0 for JPY, 2 for INR/AED/USD, 3 for KWD/BHD.
export function minorUnits(currency: string): number {
  return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
}

// The currency's symbol ("₹", "$", "AED", ...) as Intl knows it.
export function currencySymbol(currency: string): string {
  return (
    new Intl.NumberFormat("en", { style: "currency", currency }).formatToParts(0).find((p) => p.type === "currency")?.value ?? currency
  );
}

// Converts an amount between base and a quote's currency, rounded to that currency's minor units.
export function toDisplayAmount(baseAmount: number, rate: number, currency: string): number {
  return Number((baseAmount * rate).toFixed(minorUnits(currency)));
}
