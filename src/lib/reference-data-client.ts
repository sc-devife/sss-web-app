// Client-safe counterpart to reference-data.ts. That module can't be
// imported from a Client Component (see its "server-only" guard) since the
// underlying country-state-city package would otherwise ship its entire
// world dataset (17MB) into client JS. These fetch the same option lists
// from the small server-side API routes instead.
import type { ReferenceOption } from "@/lib/reference-data";
import { clientApi } from "@/lib/axios/clientClient";

export type { ReferenceOption };

export async function fetchCountryOptions(): Promise<ReferenceOption[]> {
  const res = await clientApi.get<ReferenceOption[]>("/reference-data/countries");
  return res.data;
}

export async function fetchRegionOptions(countryCode: string): Promise<ReferenceOption[]> {
  if (!countryCode) return [];
  const res = await clientApi.get<ReferenceOption[]>("/reference-data/regions", { params: { country: countryCode } });
  return res.data;
}

export async function fetchCityOptions(countryCode: string, regionCode: string): Promise<ReferenceOption[]> {
  if (!countryCode || !regionCode) return [];
  const res = await clientApi.get<ReferenceOption[]>("/reference-data/cities", {
    params: { country: countryCode, region: regionCode },
  });
  return res.data;
}

export async function fetchCurrencyOptions(): Promise<ReferenceOption[]> {
  const res = await clientApi.get<ReferenceOption[]>("/reference-data/currencies");
  return res.data;
}
