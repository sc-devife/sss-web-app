// Mirrors backend TripStatus.ORDER (com.sss.app.entity.escape.TripStatus) —
// keep in sync if that ever changes.
export const TRIP_STATUS_ORDER = [
  "Planning",
  "Itinerary Drafting",
  "Quotation Sent",
  "Quote Accepted",
  "Payment Pending",
  "Partially Paid",
  "Fully Paid",
  "Trip Confirmed",
  "Ongoing",
  "Completed",
] as const;

export const TRIP_STATUS_CANCELLED = "Cancelled";
