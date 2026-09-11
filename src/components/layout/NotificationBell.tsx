"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useAppSelector } from "@/store/hooks";
import { selectUnreadCount } from "@/features/notifications/notificationsSelectors";
import { notificationsRoute } from "@/lib/nav-config";
import { FaBell } from "react-icons/fa6";

// Plain nav link to the /notifications page — no dropdown popup (that was
// removed as unused; see NotificationPanel's own history for the prior
// portal-based version). `variant` still only changes the trigger's visual
// chrome, same shape as before: "sidebar" (collapsed-rail-aware nav item) or
// "header" (compact icon-only button matching Header's other icons).
export function NotificationBell({ collapsed = false, variant = "sidebar" }: { collapsed?: boolean; variant?: "sidebar" | "header" }) {
  const pathname = usePathname();
  const active = pathname === notificationsRoute.path || pathname.startsWith(`${notificationsRoute.path}/`);
  const unreadCount = useAppSelector(selectUnreadCount);

  return (
    <Link
      href={notificationsRoute.path}
      aria-label={variant === "header" ? "Notifications" : undefined}
      title={variant === "header" || collapsed ? "Notifications" : undefined}
      className={
        variant === "header"
          ? cn(
            "relative flex items-center rounded-xl p-1.5 text-black transition-colors hover:bg-muted",
            active && "bg-muted",
          )
          : cn(
            "relative flex items-center gap-3 rounded-xl p-2.5 text-sm font-medium transition-colors",
            collapsed ? "w-auto justify-center" : "w-full",
            active
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )
      }
    >
      <span className="relative shrink-0">
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground",
              variant === "header" ? "-right-1 -top-1" : "-right-1.5 -top-1.5",
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </span>
      {variant === "sidebar" && !collapsed && <span>Notifications</span>}
    </Link>
  );
}
