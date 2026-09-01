import { backendJson } from "@/lib/backend";

export interface Service {
  uid: string;
  name: string;
  description: string | null;
  isActive: boolean;
  // Null for global master-data services; set to a hotel's uid when the
  // service was created via that hotel's own "+ Add Services".
  hotelId: string | null;
}

// Omit hotelUid for the main Services module (global only). Pass a hotel's
// uid to also include that hotel's own scoped services (for its Add/Edit
// form's Services picker) without exposing them to any other hotel.
export async function getServices(hotelUid?: string): Promise<Service[]> {
  const qs = hotelUid ? `?hotelId=${hotelUid}` : "";
  return backendJson<Service[]>(`/api/v1/services${qs}`);
}
