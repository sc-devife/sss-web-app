import { backendJson } from "@/lib/backend";

export interface Activity {
  uid: string;
  name: string;
  destination: { uid: string; name: string } | null;
  categoryCode: string | null;
  durationMinutes: number | null;
  description: string | null;
  images: string[] | null;
  basePrice: number | null;
  status: string | null;
}

export async function getActivities(): Promise<Activity[]> {
  return backendJson<Activity[]>("/api/v1/activities");
}
