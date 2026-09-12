import { backendJson } from "@/lib/backend";

export interface Amenity {
  uid: string;
  name: string;
  isActive: boolean;
}

// Always global — unlike Services, an amenity added from one hotel's form
// is immediately reusable by every other hotel, so there's no hotelId
// scoping param here.
export async function getAmenities(): Promise<Amenity[]> {
  return backendJson<Amenity[]>("/api/v1/amenities");
}
