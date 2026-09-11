import { createSlice } from "@reduxjs/toolkit";
import type { AppNotification } from "@/features/notifications/types";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllRead,
  updateNotificationSoundPreference,
} from "@/features/notifications/notificationsThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface NotificationsState {
  items: AppNotification[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  status: RequestStatus;
  error: string | null;
  currentRequestId: string | null;

  unreadCount: number;
  // null until the first poll resolves — the baseline is seeded silently,
  // never treated as "new" (see the fetchUnreadCount.fulfilled reducer).
  previousUnreadCount: number | null;
  // Set true only when a poll finds a strictly higher count than the last
  // one — the single signal the sound/toast effect (NotificationBell) acts
  // on, then clears via clearJustIncreased. Never set by mark-read/mark-all/
  // the initial fetch/page refresh — those only ever decrease or seed it.
  justIncreased: boolean;

  soundEnabled: boolean;
}

const initialState: NotificationsState = {
  items: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
  status: "idle",
  error: null,
  currentRequestId: null,
  unreadCount: 0,
  previousUnreadCount: null,
  justIncreased: false,
  soundEnabled: true,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    clearJustIncreased(state) {
      state.justIncreased = false;
    },
    // Seeded once from the logged-in user's payload on app load (see
    // AuthHydrator) — the source of truth is the backend column, this is
    // just where the frontend keeps its current value.
    setSoundEnabled(state, action: { payload: boolean }) {
      state.soundEnabled = action.payload;
    },
    // Fired once per SSE "notification" event (see notificationStream.ts) —
    // this is now the only path that ever sets justIncreased. The backend
    // only ever pushes freshly-created notifications (no backlog replay on
    // reconnect), so every push here is genuinely new by construction;
    // the uid dedupe below only guards the narrow race where the initial
    // fetchNotifications() REST call and the SSE connection both deliver
    // the same row (e.g. a notification created in the gap between the
    // two). Deduping keeps it out of `items` twice but still counts it
    // toward the unread badge/toast/sound exactly once.
    notificationReceived(state, action: { payload: AppNotification }) {
      const incoming = action.payload;
      const alreadyKnown = state.items.some((n) => n.uid === incoming.uid);
      if (!alreadyKnown) {
        state.items.unshift(incoming);
        state.totalElements += 1;
      }
      if (!incoming.isRead && !alreadyKnown) {
        state.unreadCount += 1;
        state.previousUnreadCount = state.unreadCount;
        state.justIncreased = true;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state, action) => {
        state.currentRequestId = action.meta.requestId;
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.currentRequestId) return;
        state.status = "succeeded";
        state.items = action.payload.content;
        state.page = action.payload.number;
        state.size = action.payload.size;
        state.totalElements = action.payload.totalElements;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        if (action.meta.requestId !== state.currentRequestId) return;
        state.status = "failed";
        state.error = action.payload ?? "Failed to load notifications";
      })

      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        const next = action.payload;
        if (state.previousUnreadCount !== null && next > state.previousUnreadCount) {
          state.justIncreased = true;
        }
        state.previousUnreadCount = next;
        state.unreadCount = next;
      })

      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.items.findIndex((n) => n.uid === updated.uid);
        if (idx !== -1) state.items[idx] = updated;
        if (state.unreadCount > 0) state.unreadCount -= 1;
        state.previousUnreadCount = state.unreadCount;
      })

      .addCase(markAllRead.fulfilled, (state) => {
        state.items = state.items.map((n) => ({ ...n, isRead: true }));
        state.unreadCount = 0;
        state.previousUnreadCount = 0;
      })

      .addCase(updateNotificationSoundPreference.fulfilled, (state, action) => {
        state.soundEnabled = action.payload;
      });
  },
});

export const { clearJustIncreased, setSoundEnabled, notificationReceived } = notificationsSlice.actions;
export default notificationsSlice.reducer;
