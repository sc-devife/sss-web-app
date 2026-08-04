import type { Destination } from "@/lib/destinations";

export type { Destination };

export interface DestinationPayload {
  id: string;
  name: string;
  countryCode: string;
  regionCode: string;
  cityCode: string;
  description: string;
  images: string[];
  status: string;
}

export interface UpdateDestinationPayload {
  uid: string;
  payload: DestinationPayload;
}
