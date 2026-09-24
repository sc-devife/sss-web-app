"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchNotifications, markAllRead } from "@/features/notifications/notificationsThunks";
import { selectUnreadCount, selectNotifications, selectNotificationsStatus } from "@/features/notifications/notificationsSelectors";
import { NotificationRow } from "@/components/layout/NotificationPanel";
import { Skeleton } from "@/components/ui/Skeleton";
import { notificationsRoute } from "@/lib/nav-config";
import { FaBell } from "react-icons/fa6";
import { IoCheckmarkDoneOutline } from "react-icons/io5";

// "sidebar" is a plain nav link to the /notifications page. "header" is the
// compact bell that opens a small popup just below it (latest notifications,
// Mark all as read, and a "View all" link to the full page) instead of
// navigating away.
export function NotificationBell({ collapsed = false, variant = "sidebar" }: { collapsed?: boolean; variant?: "sidebar" | "header" }) {
  const pathname = usePathname();
  const active = pathname === notificationsRoute.path || pathname.startsWith(`${notificationsRoute.path}/`);
  const unreadCount = useAppSelector(selectUnreadCount);

  if (variant === "header") return <HeaderBell active={active} unreadCount={unreadCount} />;

  return (
    <Link
      href={notificationsRoute.path}
      title={collapsed ? "Notifications" : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-xl p-2.5 text-sm font-medium transition-colors",
        collapsed ? "w-auto justify-center" : "w-full",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <span className="relative shrink-0">
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </span>
      {!collapsed && <span>Notifications</span>}
    </Link>
  );
}

const POPUP_SIZE = 10;
const POPUP_WIDTH = 384; // matches w-[24rem] on the panel

function HeaderBell({ active, unreadCount }: { active: boolean; unreadCount: number }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const items = useAppSelector(selectNotifications);
  const status = useAppSelector(selectNotificationsStatus);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const loading = status === "idle" || status === "loading";

  useEffect(() => {
    if (!open) return;
    dispatch(fetchNotifications({ page: 0, size: POPUP_SIZE }));

    function place() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      // Open below the bell, extending mostly to its right: about 5% of the
      // popup sits to the bell's left. Clamped so it never leaves the viewport.
      const width = Math.min(POPUP_WIDTH, window.innerWidth - 16);
      const desired = rect.left + rect.width / 2 - width * 0.05;
      setPos({ top: rect.bottom + 8, left: Math.max(8, Math.min(desired, window.innerWidth - width - 8)) });
    }
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    place();
    window.addEventListener("resize", place);
    document.addEventListener("mousedown", onPointerDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("resize", place);
      document.removeEventListener("mousedown", onPointerDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open, dispatch]);

  // Close whenever navigation happens (e.g. clicking a notification's link).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Notifications"
        className={cn("relative flex items-center rounded-xl p-1.5 text-black transition-colors hover:bg-muted", (active || open) && "bg-muted")}
      >
        <span className="relative shrink-0">
          <FaBell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </span>
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Notifications"
            style={{ position: "fixed", top: pos.top, left: pos.left }}
            className="z-50 flex max-h-[28rem] w-[24rem] max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => dispatch(markAllRead())}
                  className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  <IoCheckmarkDoneOutline size={14} />
                  Mark all as read
                </button>
              )}
            </div>
            <div className="show-scrollbar flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-1.5">
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="mb-1 h-3.5 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              {!loading && items.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
              )}
              {!loading && items.slice(0, POPUP_SIZE).map((n) => <NotificationRow key={n.uid} notification={n} onNavigate={() => setOpen(false)} />)}
            </div>
            <Link
              href={notificationsRoute.path}
              onClick={() => setOpen(false)}
              className="border-t border-border px-3 py-2 text-center text-sm font-medium text-primary transition-colors hover:bg-muted"
            >
              View all
            </Link>
          </div>,
          document.body,
        )}
    </>
  );
}
