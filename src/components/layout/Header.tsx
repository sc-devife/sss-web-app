"use client";

import { usePathname } from "next/navigation";
import { findRouteByPath, profileRoute } from "@/lib/nav-config";
import Link from "next/link";
import { PiBuildings, PiList } from "react-icons/pi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleMobile } from "@/features/ui/uiSlice";
import { selectLoggedInUser } from "@/features/auth/authSelectors";
import { resolveFileUrl } from "@/lib/files";

export function Header() {
  const pathname = usePathname();
  const route = findRouteByPath(pathname);
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectLoggedInUser);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => dispatch(toggleMobile())}
          aria-label="Open navigation menu"
          className="-ml-1 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
        >
          <PiList className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">{route?.title ?? "Dashboard"}</h1>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href={profileRoute.path}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          title="View Profile"
        >
          {user?.organizationLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveFileUrl(user.organizationLogo)}
              alt="Organization logo"
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
          ) : (
            <PiBuildings className="h-8 w-8 shrink-0" />
          )}
          {user && (
            <div className="hidden text-left leading-tight sm:block">
              <div className="text-sm font-medium text-foreground">{user.userId}</div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{user.role}</div>
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}
