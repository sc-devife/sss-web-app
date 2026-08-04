import type { Transport } from "@/lib/transports";

export type { Transport };

export interface TransportPayload {
  modeCode: string;
  vehicleTypeCode: string | null;
  capacity: number | null;
  providerId: string | null;
  basePrice: number | null;
  pickupLocation: string | null;
  dropLocation: string | null;
  destinationId: string | null;
  status: string;
}

export interface UpdateTransportPayload {
  uid: string;
  payload: TransportPayload;
}
