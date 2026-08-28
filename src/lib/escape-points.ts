import { backendJson } from "@/lib/backend";

export interface EscapePointLocationRef {
  uid: string;
  city: string;
  state: string | null;
  country: string | null;
  displayName: string;
  isPrimary: boolean;
}

export interface EscapePoint {
  seqp: number;
  uid: string;
  id: string;
  name: string;
  description: string | null;
  images: string[] | null;
  status: string | null;
  currency: string | null;
  time_zone: string | null;
  nearest_airport: string | null;
  tags: string | null;
  remarks: string | null;
  // Which cities (Location) this destination covers, and locationLabel — the
  // primary one's displayName (or the first linked one if none is marked
  // primary) — both resolved server-side from the EscapePoint <-> Location
  // relation, not from reference-data code lookups.
  locations: EscapePointLocationRef[];
  locationLabel: string;
}

export async function getEscapePoints(): Promise<EscapePoint[]> {
  return backendJson<EscapePoint[]>("/library/escapepoints/all");
}
