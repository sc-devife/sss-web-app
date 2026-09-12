import type { ServiceProvider } from "@/lib/service-providers";

export type { ServiceProvider };

export interface ServiceProviderPayload {
  name: string;
  typeCode: string;
  // No longer collected by the Add/Edit form (kept only for bulk-import
  // compatibility, see ServiceProviderImportSchema on the backend) — the
  // form's own payload just omits it, which the update endpoint's
  // ignore-nulls mapping already leaves untouched.
  contactInfo?: string;
  contactName: string;
  contactNumber: string;
  contactEmail: string;
  countryCode: string;
  quantity: number | null;
  otherTypeLabel: string | null;
  escapePointId: string | null;
  status: string;
}

export interface UpdateServiceProviderPayload {
  uid: string;
  payload: ServiceProviderPayload;
}
