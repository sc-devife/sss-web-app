import type { ServiceProvider } from "@/lib/service-providers";

export type { ServiceProvider };

export interface ServiceProviderPayload {
  name: string;
  typeCode: string;
  contactInfo: string;
  countryCode: string;
  status: string;
}

export interface UpdateServiceProviderPayload {
  uid: string;
  payload: ServiceProviderPayload;
}
