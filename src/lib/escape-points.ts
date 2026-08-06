import { backendJson } from "@/lib/backend";
import { resolveCountryLabel, resolveRegionLabel, resolveCityLabel } from "@/lib/reference-data";

export interface EscapePoint {
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
  // library itself — see EscapePointsPanel for why that matters.
  locationLabel: string;
}

export async function getEscapePoints(): Promise<EscapePoint[]> {
  const escapePoints = await backendJson<Omit<EscapePoint, "locationLabel">[]>("/library/escapepoints/all");
  return escapePoints.map((d) => ({
    ...d,
    locationLabel: [resolveCityLabel(d.cityCode), resolveRegionLabel(d.countryCode, d.regionCode), resolveCountryLabel(d.countryCode)]
      .filter(Boolean)
      .join(", "),
  }));
}
