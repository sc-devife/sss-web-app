// Single shared INR-amount formatter — every dashboard/finance figure in the
// app is an INR-normalized value (Quote.totalInr, PaymentMilestone.amountInr,
// etc.), so this is the one place that decides how those render, instead of
// each call site repeating `.toFixed(2)` with a hand-rolled "₹" prefix.
// Uses the en-IN locale for real Indian digit grouping (₹1,23,456.00), not
// just the symbol swapped onto Western grouping.
export function formatInr(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Compact form for tight chart labels/tooltips — "₹12.4K" instead of
// "₹12,400.00".
export function formatInrCompact(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
