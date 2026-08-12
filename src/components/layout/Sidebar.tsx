"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { dashboardRoute, visibleGroupsForRoles } from "@/lib/nav-config";
import { cn } from "@/lib/cn";
import { FaChevronLeft, FaChevronRight, FaPowerOff } from "react-icons/fa";
import { clientApi } from "@/lib/axios/clientClient";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCollapsed as setCollapsedAction, closeMobile as closeMobileAction } from "@/features/ui/uiSlice";
import { clearLoggedInUser } from "@/features/auth/authSlice";
import pkg from "../../../package.json";

const COLLAPSED_STORAGE_KEY = "sidebar-collapsed";

function NavLink({
  path,
  title,
  Icon,
  collapsed,
}: {
  path: string;
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === path || pathname.startsWith(`${path}/`);

  return (
    <Link
      href={path}
      title={collapsed ? title : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
        collapsed && "md:justify-center md:px-2",
        active
          ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/15"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      <span className={cn("truncate font-medium", collapsed && "md:hidden")}>{title}</span>
    </Link>
  );
}

export function Sidebar({ roles }: { roles: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector((state) => state.ui.collapsed);
  const mobileOpen = useAppSelector((state) => state.ui.mobileOpen);
  const [loggingOut, setLoggingOut] = useState(false);

  const groups = visibleGroupsForRoles(roles);

  useEffect(() => {
    const saved = localStorage.getItem(COLLAPSED_STORAGE_KEY);
    if (saved !== null) dispatch(setCollapsedAction(saved === "true"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    dispatch(closeMobileAction());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function setCollapsed(value: boolean) {
    dispatch(setCollapsedAction(value));
    localStorage.setItem(COLLAPSED_STORAGE_KEY, String(value));
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await clientApi.post("/logout");
      dispatch(clearLoggedInUser());
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden" onClick={() => dispatch(closeMobileAction())} aria-hidden="true" />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-card transition-transform duration-300 md:static md:z-auto md:translate-x-0 md:transition-[width] md:duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "md:w-20" : "md:w-72",
        )}
      >
        {/* Brand */}
        <div className={cn("flex items-center justify-between border-b h-14 px-3 py-1 pb-2", collapsed && "md:justify-center md:px-2")}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex size-10 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/50">
              <img
                src="/logo.jpg"
                alt="Travel Online Agency"
                className="h-full w-full object-contain"
              />
            </div>
            <div className={cn("min-w-0", collapsed && "md:hidden")}>
              <h2 className="truncate text-lg font-bold">Travel CRM</h2>
              <p className="truncate text-xs text-muted-foreground">Travel Management Platform</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "hidden shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex",
              collapsed && "md:hidden",
            )}
            title={collapsed ? "Maximize sidebar" : "Minimize sidebar"}
          >
            <FaChevronLeft className="h-4 w-4" />
          </button>
          {collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              aria-label="Expand sidebar"
              className="mx-auto mt-2 hidden rounded-lg py-1.5 px-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex"
              title="Maximize sidebar"
            >
              <FaChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            <NavLink path={dashboardRoute.path} title={dashboardRoute.title} Icon={dashboardRoute.icon} collapsed={collapsed} />
          </div>

          {groups.map((group) => (
            <div key={group.id} className="mt-4">
              <div className={cn("mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground", collapsed && "md:hidden")}>
                {group.title}
              </div>
              {collapsed && <div className="mx-3 mb-3 hidden border-t border-border md:block" aria-hidden="true" />}
              <div className="space-y-1">
                {group.routes.map((route) => (
                  <NavLink key={route.path} path={route.path} title={route.title} Icon={route.icon} collapsed={collapsed} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title={collapsed ? "Logout" : undefined}
            className={cn(
              "flex w-full items-center justify-center gap-3 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm font-medium text-danger transition hover:bg-danger/10 disabled:opacity-50",
              collapsed && "md:px-2",
            )}
          >
            <FaPowerOff className="h-4 w-4 shrink-0" />
            <span className={cn(collapsed && "md:hidden")}>{loggingOut ? "Logging out…" : "Logout"}</span>
          </button>

          <p className={cn("mt-1 text-center text-xs text-muted-foreground", collapsed && "md:hidden")}>
            Travel CRM v{pkg.version}
          </p>
        </div>
      </aside>
    </>
  );
}
