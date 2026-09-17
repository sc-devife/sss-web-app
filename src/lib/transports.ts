import { backendJson } from "@/lib/backend";

export interface Transport {
  uid: string;
  modeCode: string;
  vehicleTypeCode: string | null;
  vehicleNumber: string | null;
  capacity: number | null;
  // "single" (individual owner-operator) vs "multi" (fleet/provider
  // company) — see Transport.ownerType on the backend.
  ownerType: string | null;
  provider: { uid: string; name: string } | null;
  basePrice: number | null;
  pickupLocation: string | null;
  dropLocation: string | null;
  contactName: string | null;
  contactNumber: string | null;
  contactEmail: string | null;
  escapePoint: { uid: string; name: string } | null;
  status: string | null;
}

export async function getTransports(): Promise<Transport[]> {
  return backendJson<Transport[]>("/api/v1/transports");
}

// Every vehicle linked to one Service Provider — backs that provider's
// Detail page "Vehicles" section. Only Multi Vehicle Owner transports ever
// set provider (see TransportPanel), so a Single Vehicle Owner's own
// vehicles never show up here.
export async function getTransportsByProvider(providerUid: string): Promise<Transport[]> {
  return backendJson<Transport[]>(`/api/v1/transports?providerId=${providerUid}`);
}
