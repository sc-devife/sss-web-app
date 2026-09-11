import type { Page } from "@/lib/pagination";

export interface AppNotification {
  uid: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityType: string | null;
  relatedEntityUid: string | null;
}

export type NotificationsPage = Page<AppNotification>;

export interface FetchNotificationsParams {
  page?: number;
  size?: number;
}
