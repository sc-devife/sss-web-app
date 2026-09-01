import { backendJson } from "@/lib/backend";

export interface Activity {
  uid: string;
  name: string;
  escapePoint: { uid: string; name: string } | null;
  categoryCode: string | null;
  durationMinutes: number | null;
  description: string | null;
  images: string[] | null;
  basePrice: number | null;
  status: string | null;
  notes: string | null;
}

export interface ActivityBooking {
  itineraryItemUid: string;
  escapeUid: string;
  escapeStatus: string | null;
  escapeStartDate: string | null;
  escapeEndDate: string | null;
  leadName: string | null;
  dayNumber: number | null;
  startTime: string | null;
  notes: string | null;
}

export async function getActivities(): Promise<Activity[]> {
  return backendJson<Activity[]>("/api/v1/activities");
}

export async function getActivityByUid(uid: string): Promise<Activity> {
  return backendJson<Activity>(`/api/v1/activities/${uid}`);
}
