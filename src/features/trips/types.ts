export type { Trip } from "@/lib/trips";

export interface TripAuditLogEntry {
  action: string;
  previousValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface AdvanceTripPayload {
  tripId: number;
  targetStatus: string;
}

export interface CancelTripPayload {
  tripId: number;
  reason: string;
}
