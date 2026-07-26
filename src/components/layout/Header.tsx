"use client";

import { usePathname } from "next/navigation";
import { findRouteByPath, profileRoute } from "@/lib/nav-config";
import Link from "next/link";
import { LiaUserCircle } from "react-icons/lia";

export function Header() {
  const pathname = usePathname();
  const route = findRouteByPath(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-5">
      <h1 className="text-sm font-semibold text-foreground">{route?.title ?? "Dashboard"}</h1>
      <Link href={profileRoute.path} className="text-muted-foreground hover:text-foreground">
        <LiaUserCircle className="h-6 w-6" />
      </Link>
    </header>
  );
}
