"use client";

import { usePathname } from "next/navigation";
import { findRouteByPath, profileRoute } from "@/lib/nav-config";
import Link from "next/link";
import { PiListFill, PiHouseFill } from "react-icons/pi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleMobile } from "@/features/ui/uiSlice";
import { selectLoggedInUser } from "@/features/auth/authSelectors";
import { resolveFileUrl } from "@/lib/files";

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

export function Header() {
  const pathname = usePathname();
  const route = findRouteByPath(pathname);
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectLoggedInUser);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-5">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          aria-label="Dashboard"
          className="-ml-1 flex items-center rounded-lg p-1.5 text-black transition-colors hover:bg-muted"
        >
          <PiHouseFill className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={() => dispatch(toggleMobile())}
          aria-label="Open navigation menu"
          className="flex items-center rounded-lg p-1.5 text-black transition-colors hover:bg-muted md:hidden"
        >
          <PiListFill className="h-5 w-5" />
        </button>
        <span className="h-3 w-px bg-border/50" aria-hidden="true" />
        {route?.icon && <route.icon className="h-4 w-4 text-black" />}
        <h1 className="text-base font-semibold text-foreground">{route?.title ?? "Dashboard"}</h1>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href={profileRoute.path}
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/15 text-sm font-semibold text-primary ring-1 ring-border/20 transition-colors hover:ring-primary/40"
          title="View Profile"
        >
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
        </Link>
      </div>
    </header>
  );
}
