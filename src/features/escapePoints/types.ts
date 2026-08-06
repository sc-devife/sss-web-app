import type { EscapePoint } from "@/lib/escape-points";

export type { EscapePoint };

export interface EscapePointPayload {
  id: string;
  name: string;
  countryCode: string;
  regionCode: string;
  cityCode: string;
  description: string;
  images: string[];
  status: string;
}

export interface UpdateEscapePointPayload {
  uid: string;
  payload: EscapePointPayload;
}
