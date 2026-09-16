import type { Hotel } from "@/lib/hotels";

export type { Hotel };

export interface HotelPayload {
  name: string;
  stars: number | null;
  locationId: string;
  escapePointId: string | null;
  mealPlanIds: string[];
  roomTypePricing: { roomTypeId: string; price: number | null }[];
  serviceIds: string[];
  checkInTime: string | null;
  checkOutTime: string | null;
  childAgeForExtraBed: string;
  rateValidFrom: string | null;
  rateValidTo: string | null;
  address: string;
  phoneNumber: string;
  email: string;
  images: string[];
  amenities: string[];
  status: string;
  notes: string;
  // Optional: only the Hotel Detail page's Account tab ever sends these
  // (via a Partial<HotelPayload> update) — the Add/Edit Hotel form's own
  // create/update payload never touches them.
  accountHolderName?: string;
  bankName?: string;
  branchName?: string;
  accountType?: string;
  accountNumber?: string;
  ifsc?: string;
  upiId?: string;
}

export interface UpdateHotelPayload {
  uid: string;
  payload: Partial<HotelPayload>;
}

export interface SetHotelPriorityImagePayload {
  uid: string;
  imageUrl: string;
}
