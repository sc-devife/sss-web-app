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
  notes?: string;
}

export interface UpdateActivityPayload {
  uid: string;
  // Partial, same as Hotel's update payload — the backend mapper ignores
  // null/omitted fields (NullValuePropertyMappingStrategy.IGNORE), so a
  // caller can send just e.g. { notes } without resending the whole form.
  payload: Partial<ActivityPayload>;
}
