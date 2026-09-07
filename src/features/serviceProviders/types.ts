import type { ServiceProvider } from "@/lib/service-providers";

export type { ServiceProvider };

export interface ServiceProviderPayload {
  name: string;
  typeCode: string;
  contactInfo: string;
  countryCode: string;
  escapePointId: string | null;
  status: string;
}

export interface UpdateServiceProviderPayload {
  uid: string;
  payload: ServiceProviderPayload;
}
