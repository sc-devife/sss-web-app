import type { Hotel } from "@/lib/hotels";

export type { Hotel };

export interface HotelPayload {
  name: string;
  stars: number | null;
  locationId: string;
  escapePointId: string | null;
  address: string;
  contactInfo: string;
  images: string[];
  amenities: string[];
  status: string;
}

export interface UpdateHotelPayload {
  uid: string;
  payload: HotelPayload;
}
