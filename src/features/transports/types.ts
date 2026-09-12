import type { Transport } from "@/lib/transports";

export type { Transport };

export interface TransportPayload {
  modeCode: string;
  vehicleTypeCode: string | null;
  vehicleNumber: string | null;
  capacity: number | null;
  ownerType: string;
  providerId: string | null;
  basePrice: number | null;
  pickupLocation: string | null;
  dropLocation: string | null;
  contactName: string | null;
  contactNumber: string | null;
  contactEmail: string | null;
  escapePointId: string | null;
  status: string;
}

export interface UpdateTransportPayload {
  uid: string;
  payload: TransportPayload;
}
