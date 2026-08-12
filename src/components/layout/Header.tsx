"use client";

import { usePathname } from "next/navigation";
import { findRouteByPath, profileRoute } from "@/lib/nav-config";
import Link from "next/link";
import { PiListFill, PiHouseFill, PiBuildingsFill, PiCaretDownFill } from "react-icons/pi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleMobile } from "@/features/ui/uiSlice";
import { selectLoggedInUser } from "@/features/auth/authSelectors";
import { resolveFileUrl } from "@/lib/files";
import { cn } from "@/lib/cn";

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
      <div className="flex items-center gap-2">
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
            <PiCaretDownFill className="hidden h-2.5 w-2.5 sm:block" aria-hidden="true" />
          </div>
        )}
        <Link
          href={profileRoute.path}
          className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-[11px] font-semibold text-primary transition-opacity hover:opacity-80"
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
