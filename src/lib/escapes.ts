import { backendJson } from "@/lib/backend";
import { resolveLocationLabel } from "@/lib/reference-data";
import type { Lead } from "@/lib/leads";
import type { EscapePoint } from "@/lib/escape-points";

export interface Escape {
  uid: string;
  lead: Lead | null;
  travellers: { uid: string; firstName: string; lastName: string | null }[];
  // locationLabel is resolved server-side by the /api/escapes/[id] route
  // handler (mirrors getEscapePoints()'s resolution) — reference-data.ts's
  // resolvers are server-only and can't run in the client bundle that
  // consumes this type.
  escapePoints: EscapePoint[];
  startDate: string | null;
  numberOfDays: number | null;
  endDate: string | null;
  status: string;
}

function withLocationLabels(escape: Escape): Escape {
  return { ...escape, escapePoints: escape.escapePoints.map((ep) => ({ ...ep, locationLabel: resolveLocationLabel(ep) })) };
}

export async function getEscapes(): Promise<Escape[]> {
  const escapes = await backendJson<Escape[]>("/escape");
  return escapes.map(withLocationLabels);
}

export async function getEscapeById(uid: string): Promise<Escape> {
  const escape = await backendJson<Escape>(`/escape/${uid}`);
  return withLocationLabels(escape);
}
