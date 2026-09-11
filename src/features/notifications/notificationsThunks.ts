import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { AppNotification, NotificationsPage, FetchNotificationsParams } from "@/features/notifications/types";

// Mirrors followupsThunks.ts exactly.

export const fetchNotifications = createAsyncThunk<NotificationsPage, FetchNotificationsParams | void, { rejectValue: string }>(
  "notifications/fetchNotifications",
  async (params, { rejectWithValue }) => {
    try {
      const search = new URLSearchParams();
      if (params?.page != null) search.set("page", String(params.page));
      if (params?.size != null) search.set("size", String(params.size));
      const qs = search.toString();
      const res = await clientApi.get<NotificationsPage>(`/notifications${qs ? `?${qs}` : ""}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load notifications"));
    }
  },
);

export const fetchUnreadCount = createAsyncThunk<number, void, { rejectValue: string }>(
  "notifications/fetchUnreadCount",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<{ count: number }>("/notifications/unread-count");
      return res.data.count;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load unread count"));
    }
  },
);

export const markNotificationRead = createAsyncThunk<AppNotification, string, { rejectValue: string }>(
  "notifications/markNotificationRead",
  async (uid, { rejectWithValue }) => {
    try {
      const res = await clientApi.patch<AppNotification>(`/notifications/${uid}/read`);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to mark notification as read"));
    }
  },
);

export const markAllRead = createAsyncThunk<void, void, { rejectValue: string }>(
  "notifications/markAllRead",
  async (_arg, { rejectWithValue }) => {
    try {
      await clientApi.patch("/notifications/read-all");
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to mark all as read"));
    }
  },
);

export const updateNotificationSoundPreference = createAsyncThunk<boolean, boolean, { rejectValue: string }>(
  "notifications/updateNotificationSoundPreference",
  async (enabled, { rejectWithValue }) => {
    try {
      await clientApi.patch("/users/me/notification-sound", { enabled });
      return enabled;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to update sound preference"));
    }
  },
);
