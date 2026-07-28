import { backendJson } from "@/lib/backend";

export interface PriorityCalendarEntry {
  uid: string;
  label: string;
  startDate: string;
  endDate: string;
}

export async function getPriorityCalendarEntries(): Promise<PriorityCalendarEntry[]> {
  return backendJson<PriorityCalendarEntry[]>("/api/priority-calendar");
}
