import { backendJson } from "@/lib/backend";

export interface ReminderRule {
  uid: string | null;
  label: string;
  offsetDays: number;
  recurring: boolean;
  isActive: boolean;
  fallback: boolean;
}

export async function getReminderRules(): Promise<ReminderRule[]> {
  return backendJson<ReminderRule[]>("/api/reminder-rules");
}
