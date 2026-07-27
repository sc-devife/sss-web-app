import { backendJson } from "@/lib/backend";
import { resolveCountryLabel, resolveRegionLabel, resolveCityLabel } from "@/lib/reference-data";

export interface Destination {
  seqp: number;
  uid: string;
  id: string;
  name: string;
  countryCode: string | null;
  regionCode: string | null;
  cityCode: string | null;
  description: string | null;
  images: string[] | null;
  status: string | null;
  currency: string | null;
  nearest_airport: string | null;
  tags: string | null;
  remarks: string | null;
  // Resolved server-side (Section 14: code is stored, label is resolved at
  // render time) so the client list/table never needs the reference-data
  // library itself — see DestinationsPanel for why that matters.
  locationLabel: string;
}

export async function getDestinations(): Promise<Destination[]> {
  const destinations = await backendJson<Omit<Destination, "locationLabel">[]>("/library/escapepoints/all");
  return destinations.map((d) => ({
    ...d,
    locationLabel: [resolveCityLabel(d.cityCode), resolveRegionLabel(d.countryCode, d.regionCode), resolveCountryLabel(d.countryCode)]
      .filter(Boolean)
      .join(", "),
  }));
}
