// Section 14 pattern: the DB/API only ever stores a stable code (never a
// display label). These helpers are the one place that turns a stored code
// back into a label, and the one place that lists options for a dropdown.
// Every "pick from a standard list" field (country/region/city/currency, and
// any future one) should go through here rather than re-implementing lookups.
//
// Server-only, enforced: country-state-city embeds its entire world dataset
// (17MB unpacked) in the module — importing this from a Client Component
// bundles all of it into client JS (a "/library/escape-points" page briefly
// shipped a 2.3MB bundle this way). Client components must go through
// src/lib/reference-data-client.ts's fetch-based API instead.
import "server-only";
import { Country, State, City } from "country-state-city";
import currencyCodes from "currency-codes";

export type ReferenceFieldType = "country" | "region" | "city" | "currency";

export interface ReferenceOption {
  code: string;
  label: string;
}

export function getCountryOptions(): ReferenceOption[] {
  return Country.getAllCountries().map((c) => ({ code: c.isoCode, label: c.name }));
}

export function getRegionOptions(countryCode: string): ReferenceOption[] {
  if (!countryCode) return [];
  return State.getStatesOfCountry(countryCode).map((s) => ({ code: s.isoCode, label: s.name }));
}

// country-state-city has no stable per-city code, only a name scoped to a
// country+state — so for city we store/resolve the name itself as the "code".
export function getCityOptions(countryCode: string, regionCode: string): ReferenceOption[] {
  if (!countryCode || !regionCode) return [];
  return City.getCitiesOfState(countryCode, regionCode).map((c) => ({ code: c.name, label: c.name }));
}

export function getCurrencyOptions(): ReferenceOption[] {
  return currencyCodes.data.map((c) => ({ code: c.code, label: `${c.code} — ${c.currency}` }));
}

export function resolveCountryLabel(code: string | null | undefined): string {
  if (!code) return "";
  return Country.getCountryByCode(code)?.name ?? code;
}

export function resolveRegionLabel(countryCode: string | null | undefined, regionCode: string | null | undefined): string {
  if (!countryCode || !regionCode) return regionCode ?? "";
  return State.getStateByCodeAndCountry(regionCode, countryCode)?.name ?? regionCode;
}

// City has no separate code, so the stored value already is the label.
export function resolveCityLabel(cityCode: string | null | undefined): string {
  return cityCode ?? "";
}

// Combined "city, region, country" label from stored codes — same
// composition getEscapePoints() (lib/escape-points.ts) uses, extracted here
// so other server-only call sites (e.g. the /api/escapes/[id] route, and
// lib/escapes.ts's own getEscapeById/getEscapes) can reuse it instead of
// re-deriving it.
export function resolveLocationLabel(codes: {
  countryCode: string | null | undefined;
  regionCode: string | null | undefined;
  cityCode: string | null | undefined;
}): string {
  return [resolveCityLabel(codes.cityCode), resolveRegionLabel(codes.countryCode, codes.regionCode), resolveCountryLabel(codes.countryCode)]
    .filter(Boolean)
    .join(", ");
}

export function resolveCurrencyLabel(code: string | null | undefined): string {
  if (!code) return "";
  const entry = currencyCodes.code(code);
  return entry ? `${entry.code} — ${entry.currency}` : code;
}

// Generic entry point: given a field type + stored code, return the label to
// render. Region/city need the parent country (and region, for city) for
// context since their codes are only unique within their parent.
export function resolveReferenceLabel(
  type: ReferenceFieldType,
  code: string | null | undefined,
  context?: { countryCode?: string | null; regionCode?: string | null }
): string {
  switch (type) {
    case "country":
      return resolveCountryLabel(code);
    case "region":
      return resolveRegionLabel(context?.countryCode, code);
    case "city":
      return resolveCityLabel(code);
    case "currency":
      return resolveCurrencyLabel(code);
  }
}
