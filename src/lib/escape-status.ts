// Mirrors backend EscapeStatus.ORDER (com.sss.app.entity.escape.EscapeStatus) —
// keep in sync if that ever changes.
export const ESCAPE_STATUS_ORDER = [
  "Planning",
  "Itinerary Drafting",
  "Quotation Sent",
  "Quote Accepted",
  "Payment Pending",
  "Partially Paid",
  "Fully Paid",
  "Escape Confirmed",
  "Ongoing",
  "Completed",
] as const;

export const ESCAPE_STATUS_CANCELLED = "Cancelled";
