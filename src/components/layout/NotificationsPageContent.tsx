"use client";

import { useEffect, useState } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { Card } from "@/components/ui/Card";
import { Body } from "@/components/ui/Typography";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { NotificationRow } from "@/components/layout/NotificationPanel";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchNotifications, markAllRead } from "@/features/notifications/notificationsThunks";
import {
  selectNotifications,
  selectNotificationsStatus,
  selectNotificationsError,
  selectNotificationsPage,
  selectNotificationsTotalPages,
  selectUnreadCount,
} from "@/features/notifications/notificationsSelectors";

const PAGE_SIZE = 20;

// The full /notifications page — same NotificationRow as the sidebar
// dropdown, just full-width and paginated instead of capped at 10.
export function NotificationsPageContent() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectNotifications);
  const status = useAppSelector(selectNotificationsStatus);
  const error = useAppSelector(selectNotificationsError);
  const serverPage = useAppSelector(selectNotificationsPage);
  const totalPages = useAppSelector(selectNotificationsTotalPages);
  const unreadCount = useAppSelector(selectUnreadCount);

  const [page, setPage] = useState(0);
  const loading = status === "idle" || status === "loading";

  useEffect(() => {
    dispatch(fetchNotifications({ page, size: PAGE_SIZE }));
  }, [dispatch, page]);

  return (
    <Card variant="page" className="flex min-h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        {unreadCount > 0 && (
          <Button size="sm" variant="ghost" onClick={() => dispatch(markAllRead())}>
            Mark all as read
          </Button>
        )}
      </div>

      {status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="mb-1 h-3.5 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}

            {!loading && items.length === 0 && (
              <div className="flex flex-col items-center gap-1 py-16 text-center">
                <Body className="font-medium">You&apos;re all caught up.</Body>
                <Body muted>No new notifications.</Body>
              </div>
            )}

            {!loading && items.map((n) => <NotificationRow key={n.uid} notification={n} />)}
          </div>

          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 border-t border-border pt-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={serverPage <= 0}
                aria-label="Previous page"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                <IoChevronBack size={16} />
              </button>
              <span className="text-sm text-muted-foreground">Page {serverPage + 1} of {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={serverPage >= totalPages - 1}
                aria-label="Next page"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                <IoChevronForward size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
