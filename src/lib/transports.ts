import { backendJson } from "@/lib/backend";

export interface Transport {
  uid: string;
  modeCode: string;
  vehicleTypeCode: string | null;
  capacity: number | null;
  provider: { uid: string; name: string } | null;
  basePrice: number | null;
  pickupLocation: string | null;
  dropLocation: string | null;
  destination: { uid: string; name: string } | null;
  status: string | null;
}

export async function getTransports(): Promise<Transport[]> {
  return backendJson<Transport[]>("/api/v1/transports");
}
