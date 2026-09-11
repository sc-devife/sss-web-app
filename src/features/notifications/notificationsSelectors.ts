import type { RootState } from "@/store/store";

export const selectNotifications = (state: RootState) => state.notifications.items;
export const selectNotificationsStatus = (state: RootState) => state.notifications.status;
export const selectNotificationsError = (state: RootState) => state.notifications.error;
export const selectNotificationsPage = (state: RootState) => state.notifications.page;
export const selectNotificationsTotalPages = (state: RootState) => state.notifications.totalPages;

export const selectUnreadCount = (state: RootState) => state.notifications.unreadCount;
export const selectJustIncreased = (state: RootState) => state.notifications.justIncreased;
export const selectSoundEnabled = (state: RootState) => state.notifications.soundEnabled;
