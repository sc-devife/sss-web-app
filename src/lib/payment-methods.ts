// Shared payment-method option list — previously duplicated separately in
// DealPanel.tsx (a Select's options) and TransactionsPanel.tsx (a
// display-only label map). One copy, reused by every payment-recording form
// including HotelPaymentModal.
export const PAYMENT_METHOD_OPTIONS = [
  { value: "upi", label: "UPI" },
  { value: "neft", label: "NEFT" },
  { value: "rtgs", label: "RTGS" },
  { value: "imps", label: "IMPS" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

export function paymentMethodLabel(value: string | null | undefined): string {
  return PAYMENT_METHOD_OPTIONS.find((o) => o.value === value)?.label ?? value ?? "—";
}
