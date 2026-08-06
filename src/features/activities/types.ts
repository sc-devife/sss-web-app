import type { Activity } from "@/lib/activities";

export type { Activity };

export interface ActivityPayload {
  name: string;
  escapePointId: string | null;
  categoryCode: string | null;
  durationMinutes: number | null;
  description: string;
  images: string[];
  basePrice: number | null;
  status: string;
}

export interface UpdateActivityPayload {
  uid: string;
  payload: ActivityPayload;
}
