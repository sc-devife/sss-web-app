"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { toast } from "react-toastify";
import { findRouteByPath, profileRoute } from "@/lib/nav-config";
import Link from "next/link";
import { PiHouseFill, PiBuildingsFill } from "react-icons/pi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleMobile } from "@/features/ui/uiSlice";
import { selectLoggedInUser } from "@/features/auth/authSelectors";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { fetchUnreadCount } from "@/features/notifications/notificationsThunks";
import { selectJustIncreased, selectSoundEnabled } from "@/features/notifications/notificationsSelectors";
import { clearJustIncreased } from "@/features/notifications/notificationsSlice";
import { armAudioUnlock, playNotificationChime } from "@/lib/notificationSound";
import { useNotificationStream } from "@/lib/notificationStream";
import { resolveFileUrl } from "@/lib/files";
import { cn } from "@/lib/cn";
import { RiMenuUnfoldLine } from "react-icons/ri";

// First letter of first + last name (e.g. "John Doe" -> "JD"); just the
// first letter of the first name when there's no last name on file.
function userInitials(user: { firstName?: string; lastName?: string; name: string } | null): string {
  if (!user) return "?";
  const first = user.firstName?.trim();
  const last = user.lastName?.trim();
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first[0].toUpperCase();
  return user.name.trim().charAt(0).toUpperCase() || "?";
}

// "First Last", falling back to the plain `name` field when firstName/
// lastName haven't hydrated yet (see LoggedInUser's own comment on why).
function userFullName(user: { firstName?: string; lastName?: string; name: string } | null): string {
  if (!user) return "";
  const first = user.firstName?.trim();
  const last = user.lastName?.trim();
  return first || last ? [first, last].filter(Boolean).join(" ") : user.name;
}

// 24px tall regardless of shape, so it sits flush with the org-name text.
const LOGO_SHAPE_CLASS: Record<string, string> = {
  round: "h-6 w-6 rounded-full",
  square: "h-6 w-6 rounded-md",
  rectangle: "h-6 w-auto max-w-[84px] rounded-sm",
};

export function Header() {
  const pathname = usePathname();
  const route = findRouteByPath(pathname);
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectLoggedInUser);
  const shapeClass = LOGO_SHAPE_CLASS[user?.organizationLogoShape ?? "round"] ?? LOGO_SHAPE_CLASS.round;

  const justIncreased = useAppSelector(selectJustIncreased);
  const soundEnabled = useAppSelector(selectSoundEnabled);

  // One-time baseline load — fetch the current unread count once on mount
  // (initial page load / refresh) so the badge is correct immediately.
  // Delivery of *new* notifications after this point is SSE's job
  // (useNotificationStream below), not a repeated poll: notificationReceived
  // (notificationsSlice) increments unreadCount itself as each push arrives,
  // so there's nothing left here to re-fetch on an interval.
  useEffect(() => {
    armAudioUnlock();
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  // Opens the one live SSE connection for the whole app — mounted here for
  // the same reason the old poll interval lived here: Header renders once
  // (unlike Sidebar's SidebarFooter, which mounts twice), so a single
  // connection per session is guaranteed without extra guarding.
  useNotificationStream();

  // Fires only when notificationReceived (notificationsSlice) sets
  // justIncreased — i.e. exactly once per genuinely new SSE-pushed
  // notification. Never on mount's own baseline fetch, mark-read,
  // mark-all-read, opening the panel, or a heartbeat, all of which either
  // don't touch this flag or only ever decrease/seed the count.
  useEffect(() => {
    if (!justIncreased) return;
    toast("You have a new notification.");
    if (soundEnabled) {
      playNotificationChime();
    }
    dispatch(clearJustIncreased());
  }, [justIncreased, soundEnabled, dispatch]);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => dispatch(toggleMobile())}
          aria-label="Open navigation menu"
          className="flex items-center rounded-xl p-1.5 text-black transition-colors hover:bg-muted md:hidden"
          title="Open navigation menu"
        >
          <RiMenuUnfoldLine className="h-5 w-5" />
        </button>
        <Link
          href="/dashboard"
          aria-label="Dashboard"
          className="-ml-1 flex items-center rounded-xl p-1.5 text-black transition-colors hover:bg-muted"
          title="Dashboard"
        >
          <PiHouseFill size={20} />
        </Link>
        <span className="h-3 w-px bg-border/50" aria-hidden="true" />
        {route?.icon && <route.icon size={20} />}
        <h1 className="text-lg font-semibold text-foreground">{route?.title ?? "Dashboard"}</h1>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell variant="header" />
        {user?.organizationName && (
          <div
            className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={user.organizationName}
          >
            <div className={cn("flex shrink-0 items-center justify-center overflow-hidden bg-muted", shapeClass)}>
              {user.organizationLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveFileUrl(user.organizationLogo)}
                  alt={user.organizationName}
                  className={user.organizationLogoShape === "rectangle" ? "h-full w-full object-contain" : "h-full w-full object-cover"}
                />
              ) : (
                <PiBuildingsFill className="h-3.5 w-3.5" />
              )}
            </div>
            <span className="hidden max-w-[8rem] truncate text-sm font-medium text-foreground sm:inline">
              {user.organizationName}
            </span>
          </div>
        )}
        <Link
          href={profileRoute.path}
          className="flex items-center gap-2 rounded-xl p-1 transition-opacity hover:opacity-80"
          title="View Profile"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/15 text-[11px] font-semibold text-primary">
            {user?.profilePicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveFileUrl(user.profilePicture)}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              userInitials(user)
            )}
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="max-w-[9rem] truncate text-sm font-medium text-foreground">{userFullName(user)}</span>
            <span className="max-w-[9rem] truncate text-xs text-muted-foreground">{user?.role}</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
