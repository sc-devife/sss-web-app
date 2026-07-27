import { backendJson } from "@/lib/backend";
import { resolveCountryLabel } from "@/lib/reference-data";

export interface ServiceProvider {
  uid: string;
  name: string;
  typeCode: string;
  contactInfo: string | null;
  countryCode: string | null;
  status: string | null;
  countryLabel: string;
}

export async function getServiceProviders(): Promise<ServiceProvider[]> {
  const providers = await backendJson<Omit<ServiceProvider, "countryLabel">[]>("/api/v1/service-providers");
  return providers.map((p) => ({ ...p, countryLabel: resolveCountryLabel(p.countryCode) }));
}
