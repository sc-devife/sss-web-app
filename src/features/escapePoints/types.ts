import type { EscapePoint, EscapePointLocationRef } from "@/lib/escape-points";

export type { EscapePoint, EscapePointLocationRef };

export interface EscapePointPayload {
  id: string;
  name: string;
  description: string;
  images: string[];
  status: string;
  nearest_airport: string;
  currency: string;
  time_zone: string;
}

export interface UpdateEscapePointPayload {
  uid: string;
  payload: EscapePointPayload;
}

export interface UpdateEscapePointLocationsPayload {
  uid: string;
  locationUids: string[];
  primaryLocationUid: string | null;
}
