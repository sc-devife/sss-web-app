// Single shared USD-amount formatter — every dashboard/finance figure in the
// app is a USD-normalized value (Quote.totalUsd, PaymentMilestone.amountUsd,
// etc.), so this is the one place that decides how those render, instead of
// each call site repeating `.toFixed(2)` with a hand-rolled "$" prefix.
export function formatUsd(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Compact form for tight chart labels/tooltips — "$12.4K" instead of
// "$12,400.00".
export function formatUsdCompact(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
