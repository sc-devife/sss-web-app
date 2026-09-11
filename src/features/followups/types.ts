import type { Page } from "@/lib/pagination";

export type FollowUpStatus = "Pending" | "Hold" | "Completed";
export const FOLLOWUP_STATUS_OPTIONS: FollowUpStatus[] = ["Pending", "Hold", "Completed"];

export type FollowUpFilter = "today" | "yesterday" | "overdue" | "upcoming" | "all";

export interface FollowUp {
  uid: string;
  comment: string;
  actionable: boolean;
  dueAt: string | null; // ISO datetime, e.g. "2026-09-10T14:30:00"
  status: FollowUpStatus;

  leadUid: string | null;
  leadName: string | null;

  escapeUid: string | null;
  escapeTripCode: string | null;

  assignedToUid: string | null;
  assignedToName: string | null;

  createdByName: string | null;
  createdAt: string | null;
  completedAt: string | null;
}

export type FollowUpsPage = Page<FollowUp>;

export interface FetchFollowUpsParams {
  filter?: FollowUpFilter;
  search?: string;
  page?: number;
  size?: number;
}

export interface CreateFollowUpPayload {
  leadUid?: string;
  escapeUid?: string;
  comment: string;
  actionable: boolean;
  dueAt: string | null;
  assignedToUid?: string;
}

export interface UpdateFollowUpPayload {
  followUpUid: string;
  comment: string;
  actionable: boolean;
  dueAt: string | null;
  assignedToUid?: string;
}

export interface UpdateFollowUpStatusPayload {
  followUpUid: string;
  status: FollowUpStatus;
}
