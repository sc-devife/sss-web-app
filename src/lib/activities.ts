import { backendJson } from "@/lib/backend";

export interface Activity {
  uid: string;
  name: string;
  escapePoint: { uid: string; name: string } | null;
  categoryCode: string | null;
  durationMinutes: number | null;
  description: string | null;
  images: string[] | null;
  basePrice: number | null;
  /** Currency of this item's prices; null/base = the vendor's base currency. */
  priceCurrency?: string | null;
  status: string | null;
  notes: string | null;
  // Vendor/supplier email — recipient for the "Send Booking Email"
  // booking-request flow (see ActivityBookingEmailModal).
  email: string | null;
  contactNumber: string | null;
  // Rich-text HTML (RichTextEditor output).
  rulesAndPolicies: string | null;
  // This activity vendor's own payout details (bank account and/or UPI) —
  // same shape/purpose as Hotel's own Account tab. All optional.
  accountHolderName: string | null;
  bankName: string | null;
  branchName: string | null;
  // "Savings" or "Current".
  accountType: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  upiId: string | null;
}

export interface ActivityBooking {
  itineraryItemUid: string;
  escapeUid: string;
  tripCode: string | null;
  escapeStatus: string | null;
  escapeStartDate: string | null;
  escapeEndDate: string | null;
  leadName: string | null;
  dayNumber: number | null;
  startTime: string | null;
  notes: string | null;
  // Initialize / Booked / Drop (see lib/hotel-booking-status.ts — the same
  // BookingStatus values, stored directly on ItineraryItem.status for
  // Activity items since there's no separate detail table like Hotel's).
  bookingStatus: string | null;
  // price × travelersCount (or the cancellation charge if Dropped) —
  // matches what Quotation actually bills for this booking.
  totalAmount: number | null;
}

// A payout the agency makes OUT to this activity vendor for a specific
// booking — the Activity-side counterpart of HotelPayment.
export interface ActivityPayment {
  uid: string;
  escapeUid: string;
  tripCode: string | null;
  transactionId: string | null;
  paymentMethod: string;
  amount: number;
  paidBy: string | null;
  paymentDate: string;
  notes: string | null;
  status: string;
  createdAt: string;
  /** Set only when the supplier was paid in a non-base currency (amount is the base value). */
  paidAmount?: number | null;
  paidCurrency?: string | null;
  fxRate?: number | null;
}

// Populates the "Send Activity Booking Email" popup — bodyHtml is the exact
// email that would be sent, rendered server-side so the popup preview never
// drifts from what actually goes out (only Subject may be edited before
// sending; see ActivityBookingEmailModal).
export interface ActivityBookingEmailPreview {
  toEmail: string | null;
  subject: string;
  bodyHtml: string;
}

export async function getActivities(): Promise<Activity[]> {
  return backendJson<Activity[]>("/api/v1/activities");
}

export async function getActivityByUid(uid: string): Promise<Activity> {
  return backendJson<Activity>(`/api/v1/activities/${uid}`);
}
