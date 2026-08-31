import type { Hotel } from "@/lib/hotels";

export type { Hotel };

export interface HotelPayload {
  name: string;
  stars: number | null;
  locationId: string;
  escapePointId: string | null;
  mealPlanIds: string[];
  roomTypeIds: string[];
  activityIds: string[];
  checkInTime: string | null;
  checkOutTime: string | null;
  childAgeForExtraBed: string;
  rateValidFrom: string | null;
  rateValidTo: string | null;
  address: string;
  contactInfo: string;
  images: string[];
  amenities: string[];
  status: string;
  notes: string;
}

export interface UpdateHotelPayload {
  uid: string;
  payload: Partial<HotelPayload>;
}
