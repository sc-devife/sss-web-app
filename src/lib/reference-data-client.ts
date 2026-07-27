// Client-safe counterpart to reference-data.ts. That module can't be
// imported from a Client Component (see its "server-only" guard) since the
// underlying country-state-city package would otherwise ship its entire
// world dataset (17MB) into client JS. These fetch the same option lists
// from the small server-side API routes instead.
import type { ReferenceOption } from "@/lib/reference-data";

export async function fetchCountryOptions(): Promise<ReferenceOption[]> {
  const res = await fetch("/api/reference-data/countries");
  return res.json();
}

export async function fetchRegionOptions(countryCode: string): Promise<ReferenceOption[]> {
  if (!countryCode) return [];
  const res = await fetch(`/api/reference-data/regions?country=${encodeURIComponent(countryCode)}`);
  return res.json();
}

export async function fetchCityOptions(countryCode: string, regionCode: string): Promise<ReferenceOption[]> {
  if (!countryCode || !regionCode) return [];
  const res = await fetch(
    `/api/reference-data/cities?country=${encodeURIComponent(countryCode)}&region=${encodeURIComponent(regionCode)}`
  );
  return res.json();
}

export async function fetchCurrencyOptions(): Promise<ReferenceOption[]> {
  const res = await fetch("/api/reference-data/currencies");
  return res.json();
}
