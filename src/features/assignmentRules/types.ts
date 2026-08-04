import type { PriorityCalendarEntry } from "@/lib/priority-calendar";

export type { PriorityCalendarEntry };

export interface PriorityCalendarEntryPayload {
  label: string;
  startDate: string;
  endDate: string;
}

export interface ToggleAutoAssignPayload {
  organizationUid: string;
  enabled: boolean;
}
