import type { Service } from "@/lib/services";

export type { Service };

export interface ServicePayload {
  name: string;
  description: string;
  price: number | null;
}

export interface UpdateServicePayload {
  uid: string;
  payload: ServicePayload & { isActive: boolean };
}
