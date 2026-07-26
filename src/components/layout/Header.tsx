"use client";

import { usePathname, useRouter } from "next/navigation";
import { findRouteByPath, profileRoute } from "@/lib/nav-config";
import Link from "next/link";
import { LiaUserCircle, LiaSignOutAltSolid } from "react-icons/lia";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const route = findRouteByPath(pathname);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-5">
      <h1 className="text-sm font-semibold text-foreground">{route?.title ?? "Dashboard"}</h1>
      <div className="flex items-center gap-3">
        <Link href={profileRoute.path} className="text-muted-foreground hover:text-foreground">
          <LiaUserCircle className="h-6 w-6" />
        </Link>
        <button
          onClick={handleLogout}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Log out"
          title="Log out"
        >
          <LiaSignOutAltSolid className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
