"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { findRouteByPath, profileRoute } from "@/lib/nav-config";
import Link from "next/link";
import { LiaUserCircle } from "react-icons/lia";
import { PiList } from "react-icons/pi";
import { useAppDispatch } from "@/store/hooks";
import { toggleMobile } from "@/features/ui/uiSlice";
import { getStoredUserData, type StoredUserData } from "@/lib/user-data-storage";

export function Header() {
  const pathname = usePathname();
  const route = findRouteByPath(pathname);
  const dispatch = useAppDispatch();

  // Read once on mount — localStorage isn't available during SSR, and this
  // is a cached snapshot of the login response, not something that needs to
  // stay live-synced with the server.
  const [userData, setUserData] = useState<StoredUserData | null>(null);
  useEffect(() => {
    setUserData(getStoredUserData());
  }, []);

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
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <LiaUserCircle className="h-8 w-8" />
          {userData && (
            <div className="hidden text-left leading-tight sm:block">
              <div className="text-sm font-medium text-foreground">{userData.userId}</div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{userData.role}</div>
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}
