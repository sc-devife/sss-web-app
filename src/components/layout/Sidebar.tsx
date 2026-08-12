"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  const [desktopExpanded, setDesktopExpanded] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const groups = visibleGroupsForRoles(roles);
  const isExpanded = !collapsed || desktopExpanded;

  useEffect(() => {
    const saved = localStorage.getItem(COLLAPSED_STORAGE_KEY);
    if (saved !== null) dispatch(setCollapsedAction(saved === "true"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    dispatch(closeMobileAction());
    setDesktopExpanded(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (desktopExpanded && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setDesktopExpanded(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDesktopExpanded(false);
        dispatch(closeMobileAction());
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [desktopExpanded, dispatch]);

  function setCollapsed(value: boolean) {
    setDesktopExpanded(false);
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
        ref={sidebarRef}
        onMouseEnter={() => collapsed && setDesktopExpanded(true)}
        onMouseLeave={() => collapsed && setDesktopExpanded(false)}
        onFocusCapture={() => collapsed && setDesktopExpanded(true)}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(19rem,calc(100vw-2rem))] flex-col border-r bg-card shadow-xl transition-transform duration-300 md:static md:z-30 md:translate-x-0 md:shadow-none md:transition-[width] md:duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed && !desktopExpanded ? "md:w-20" : "md:w-72",
        )}
      >
        {/* Brand */}
        <div className={cn("flex items-center justify-between border-b h-14 px-3 py-1 pb-2", !isExpanded && "md:justify-center md:px-2")}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex size-10 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/50">
              <img
                src="/logo.jpg"
                alt="Travel Online Agency"
                className="h-full w-full object-contain"
              />
            </div>
            <div className={cn("min-w-0", !isExpanded && "md:hidden")}>
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
              !isExpanded && "md:hidden",
            )}
            title={collapsed ? "Maximize sidebar" : "Minimize sidebar"}
          >
            <FaChevronLeft className="h-4 w-4" />
          </button>
          {collapsed && !desktopExpanded && (
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
          <div className="flex flex-col gap-1">
            <NavLink path={dashboardRoute.path} title={dashboardRoute.title} Icon={dashboardRoute.icon} collapsed={!isExpanded} />
          </div>

          {groups.filter((group) => ["sales", "library", "organization"].includes(group.id)).map((group) => (
            <div key={group.id} className="mt-4">
              <div className={cn("mb-2 flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground", !isExpanded && "md:justify-center md:px-2")}>
                <group.icon className="size-4 shrink-0" aria-hidden="true" />
                <span className={cn(!isExpanded && "md:hidden")}>{group.title}</span>
              </div>
              <div className="flex flex-col gap-1">
                {group.routes.map((route) => (
                  <NavLink key={route.path} path={route.path} title={route.title} Icon={route.icon} collapsed={!isExpanded} />
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
            title={!isExpanded ? "Logout" : undefined}
            className={cn(
              "flex w-full items-center justify-center gap-3 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm font-medium text-danger transition hover:bg-danger/10 disabled:opacity-50",
              !isExpanded && "md:px-2",
            )}
          >
            <FaPowerOff className="h-4 w-4 shrink-0" />
            <span className={cn(!isExpanded && "md:hidden")}>{loggingOut ? "Logging out…" : "Logout"}</span>
          </button>

          <p className={cn("mt-1 text-center text-xs text-muted-foreground", !isExpanded && "md:hidden")}>
            Travel CRM v{pkg.version}
          </p>
        </div>
      </aside>
    </>
  );
}
