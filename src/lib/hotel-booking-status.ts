// Mirrors backend HotelBookingStatus (com.sss.app.entity.itinerary.HotelBookingStatus)
// — keep in sync if that ever changes.
export const HOTEL_BOOKING_STATUSES = ["Initialize", "Booked", "Drop"] as const;

export type HotelBookingStatusValue = (typeof HOTEL_BOOKING_STATUSES)[number];

export const HOTEL_BOOKING_STATUS_OPTIONS = HOTEL_BOOKING_STATUSES.map((status) => ({
  value: status,
  label: status,
}));

// Shared status -> Badge tone mapping, same pattern as lib/escape-status.ts.
export function hotelStatusTone(status: string): "neutral" | "success" | "danger" {
  if (status === "Booked") return "success";
  if (status === "Drop") return "danger";
  return "neutral"; // Initialize
}
