import type { Service } from "@/lib/services";

export type { Service };

export interface ServicePayload {
  name: string;
  description: string;
  // Not edited from the Services page any more; still sent by the Hotel form's
  // inline "add service" flow.
  price?: number | null;
}

export interface UpdateServicePayload {
  uid: string;
  payload: ServicePayload & { isActive: boolean };
}
