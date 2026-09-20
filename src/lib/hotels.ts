import { backendJson } from "@/lib/backend";

export interface Hotel {
  uid: string;
  name: string;
  stars: number | null;
  // Starting/indicative rate — shown in the itinerary's hotel suggestion
  // dropdown alongside stars. Not what a specific stay is actually booked
  // at (that's HotelDetail.price/totalPrice, entered per-itinerary-item).
  basePrice: number | null;
  location: { uid: string; displayName: string } | null;
  escapePoint: { uid: string; name: string } | null;
  mealPlans: { uid: string; code: string; name: string }[] | null;
  // Each pairing carries this hotel's own price/night for that room type —
  // see backend HotelRoomType (a join entity, not a plain M:N selection,
  // since the same shared RoomType can be priced differently per hotel).
  roomTypes: { roomTypeId: string; name: string; description: string | null; price: number | null }[] | null;
  services: { uid: string; name: string; description: string | null; price: number | null }[] | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  childAgeForExtraBed: string | null;
  rateValidFrom: string | null;
  rateValidTo: string | null;
  isActive: boolean;
  address: string | null;
  phoneNumber: string | null;
  email: string | null;
  images: string[] | null;
  // The manually-chosen main image — used wherever a single representative
  // image is needed instead of assuming images[0].
  priorityImage: string | null;
  amenities: string[] | null;
  status: string | null;
  notes: string | null;
  // Plain-text blurb, and rich-text HTML (RichTextEditor output) — both
  // edited on the Add/Edit Hotel form.
  about: string | null;
  rulesAndPolicies: string | null;
  // This hotel's own payout details (bank account and/or UPI), used when
  // settling a booking with the hotel directly — unrelated to the org's own
  // receivable bank accounts. All optional.
  accountHolderName: string | null;
  bankName: string | null;
  branchName: string | null;
  // "Savings" or "Current".
  accountType: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  upiId: string | null;
}

export interface HotelBooking {
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
  // Hotel-stay lifecycle status (Initialize / Booked / Drop) — see
  // lib/hotel-booking-status.ts. Null when the stay's detail form was never
  // filled in.
  bookingStatus: string | null;
  mealPlanName: string | null;
  // Free-text special-inclusion names booked alongside this stay — not a
  // subset of Hotel.services.
  services: string[];
  // Stay price (or cancellation charge if Dropped) plus every inclusion's
  // total — matches what Quotation actually bills for this stay.
  totalAmount: number | null;
}

// A payout the agency makes OUT to this hotel for a specific booking — the
// counterpart of a Deal's PaymentMilestone (money collected FROM a
// customer), which this is unrelated to.
export interface HotelPayment {
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
}

// Populates the "Send Hotel Booking Email" popup — bodyHtml is the exact
// email that would be sent, rendered server-side so the popup preview never
// drifts from what actually goes out (only Subject may be edited before
// sending; see HotelBookingEmailModal).
export interface HotelBookingEmailPreview {
  toEmail: string | null;
  subject: string;
  bodyHtml: string;
}

export async function getHotels(): Promise<Hotel[]> {
  return backendJson<Hotel[]>("/api/v1/hotels");
}

export async function getHotelByUid(uid: string): Promise<Hotel> {
  return backendJson<Hotel>(`/api/v1/hotels/${uid}`);
}
