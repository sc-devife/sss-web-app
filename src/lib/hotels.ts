import { backendJson } from "@/lib/backend";

export interface Hotel {
  uid: string;
  name: string;
  stars: number | null;
  location: { uid: string; displayName: string } | null;
  escapePoint: { uid: string; name: string } | null;
  mealPlans: { uid: string; code: string; name: string }[] | null;
  roomTypes: { uid: string; name: string }[] | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  childAgeForExtraBed: string | null;
  rateValidFrom: string | null;
  rateValidTo: string | null;
  isActive: boolean;
  address: string | null;
  contactInfo: string | null;
  images: string[] | null;
  amenities: string[] | null;
  status: string | null;
}

export async function getHotels(): Promise<Hotel[]> {
  return backendJson<Hotel[]>("/api/v1/hotels");
}
