import type { Service } from "@/lib/services";

export type { Service };

export interface ServicePayload {
  name: string;
  description: string;
}

export interface UpdateServicePayload {
  uid: string;
  payload: ServicePayload & { isActive: boolean };
}
