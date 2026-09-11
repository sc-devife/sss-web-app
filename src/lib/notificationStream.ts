"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { notificationReceived } from "@/features/notifications/notificationsSlice";
import type { AppNotification } from "@/features/notifications/types";

// Mount this exactly once (Header.tsx — same discipline as the old polling
// interval it replaces, see Header.tsx's own comment) to open a single live
// connection to /api/notifications/stream, the Next.js proxy that bridges
// the browser's cookie-based session to the backend's Bearer-token SSE
// endpoint (EventSource itself can't set an Authorization header, so it
// can't call the backend directly — see that route's own comment).
//
// Reconnection is entirely native: the browser's EventSource implementation
// already retries automatically (honoring the server's `retry:` hint, or a
// browser-default backoff) whenever the connection drops — backend restart,
// network blip, idle proxy timeout, whatever. Nothing here needs to
// reimplement that. What this hook does add is exactly one guard: only one
// EventSource is ever open per mount (the effect's own cleanup always closes
// the previous one before a re-run could open another), so a reconnect never
// produces a duplicate connection or a duplicate notification.
export function useNotificationStream() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const source = new EventSource("/api/notifications/stream");

    source.addEventListener("notification", (event) => {
      try {
        const notification: AppNotification = JSON.parse((event as MessageEvent).data);
        dispatch(notificationReceived(notification));
      } catch {
        // Malformed frame — drop it silently rather than let a JSON.parse
        // throw take down anything else on the page.
      }
    });

    // No-op listener: heartbeats exist purely to keep the connection warm
    // through idle-timeout proxies (see the backend registry's own
    // comment) and must never touch Redux/UI — this just prevents the
    // browser from logging an "unhandled event" note for a named event
    // type with no listener.
    source.addEventListener("heartbeat", () => {});

    // EventSource logs its own transient errors to the console and retries
    // on its own; surfacing anything louder here for a normal reconnect
    // would be exactly the "alarming error for a temporary blip" the UX
    // shouldn't show. onerror fires on genuine failures too (backend down),
    // but those look identical to a normal drop from here, and the retry
    // loop is the correct response to both.
    source.onerror = () => {};

    return () => {
      source.close();
    };
  }, [dispatch]);
}
