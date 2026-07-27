"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardRoute, visibleGroupsForRoles } from "@/lib/nav-config";
import { cn } from "@/lib/cn";

function NavLink({ path, title, Icon }: { path: string; title: string; Icon: React.ComponentType<{ className?: string }> }) {
  const pathname = usePathname();
  const active = pathname === path || pathname.startsWith(`${path}/`);
  return (
    <Link
      href={path}
      className={cn(
        "flex items-center gap-2.5 rounded px-2.5 py-1.5 text-sm transition-colors",
        active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{title}</span>
    </Link>
  );
}

export function Sidebar({ roles }: { roles: string[] }) {
  const groups = visibleGroupsForRoles(roles);

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col gap-6 border-r border-border bg-card px-3 py-5 overflow-y-auto">
      <div className="px-2 text-base font-semibold text-foreground">Travel CRM</div>

      <NavLink path={dashboardRoute.path} title={dashboardRoute.title} Icon={dashboardRoute.icon} />

      {groups.map((group) => (
        <div key={group.id} className="flex flex-col gap-1">
          <div className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{group.title}</div>
          {group.routes.map((route) => (
            <NavLink key={route.path} path={route.path} title={route.title} Icon={route.icon} />
          ))}
        </div>
      ))}
    </aside>
  );
}
