export type { Escape } from "@/lib/escapes";

export interface EscapeAuditLogEntry {
  action: string;
  previousValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface AdvanceEscapePayload {
  escapeId: number;
  targetStatus: string;
}

export interface CancelEscapePayload {
  escapeId: number;
  reason: string;
}
