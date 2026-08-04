import type { ReminderRule } from "@/lib/reminder-rules";

export type { ReminderRule };

export interface ReminderRulePayload {
  label: string;
  offsetDays: number;
  recurring: boolean;
}
