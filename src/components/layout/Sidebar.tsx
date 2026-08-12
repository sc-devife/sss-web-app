"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { dashboardRoute, protectedRoutes, visibleGroupsForRoles, type RouteGroup } from "@/lib/nav-config";
import { cn } from "@/lib/cn";
import { FaChevronLeft, FaChevronRight, FaChevronDown, FaPowerOff } from "react-icons/fa";
import { PiBellFill } from "react-icons/pi";
import { clientApi } from "@/lib/axios/clientClient";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closeMobile as closeMobileAction } from "@/features/ui/uiSlice";
import { clearLoggedInUser } from "@/features/auth/authSlice";
import pkg from "../../../package.json";

function NavLink({
  path,
  title,
  Icon,
  collapsed,
  indent,
}: {
  path: string;
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  collapsed: boolean;
  /** Extra left offset so submenu items read as children of their group
   * header rather than flush-aligned siblings. */
  indent?: boolean;
}) {
  const pathname = usePathname();
  // Plain `pathname === path || pathname.startsWith(path + "/")` would mark
  // both "/leads" and "/leads/sources" active while on "/leads/sources",
  // since "/leads" is a real sibling route, not a detail-child of "/leads".
  // Resolve the single longest-matching registered route instead — same
  // logic as findRouteByPath — so only the most specific one lights up.
  const matches = protectedRoutes.filter((r) => pathname === r.path || pathname.startsWith(`${r.path}/`));
  const bestMatch = matches.sort((a, b) => b.path.length - a.path.length)[0];
  const active = bestMatch?.path === path;

  return (
    <Link
      href={path}
      title={collapsed ? title : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
        collapsed && "justify-center px-2",
        indent && !collapsed && "ml-3",
        active
          ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/15"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      {!collapsed && <span className="truncate font-medium">{title}</span>}
    </Link>
  );
}

// Collapsed-rail representation of one group: just its icon. Clicking it
// opens the overlay panel (same as the manual toggle) rather than reflowing
// the rail itself — the group's name + its routes then appear in that panel.
function CollapsedGroupIcon({ group, onExpand }: { group: RouteGroup; onExpand: () => void }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      aria-label={`Expand ${group.title} menu`}
      title={group.title}
      className="flex items-center justify-center rounded-xl p-2.5 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground"
    >
      <group.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
    </button>
  );
}

// Full rendering of one group: title header + its routes listed underneath,
// indented as children. Used inside the overlay panel only. Each group's
// open/closed state is independent — clicking a header toggles just that
// group, and it stays open until the user collapses it again.
function ExpandedGroup({
  group,
  isOpen,
  onToggle,
}: {
  group: RouteGroup;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <group.icon className="size-4 shrink-0" aria-hidden="true" />
        <span className="flex-1 text-left">{group.title}</span>
        <FaChevronDown className={cn("h-2.5 w-2.5 shrink-0 transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="flex flex-col gap-1">
          {group.routes.map((route) => (
            <NavLink key={route.path} path={route.path} title={route.title} Icon={route.icon} collapsed={false} indent />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarBrand({
  collapsed,
  onToggle,
  showToggle = true,
}: {
  collapsed: boolean;
  onToggle: () => void;
  showToggle?: boolean;
}) {
  return (
    <div className={cn("flex h-14 items-center justify-between px-3 py-1 pb-2", collapsed ? "flex-col justify-center gap-1 px-1" : "border-b")}>
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Travel Online Agency" className="h-full w-full object-contain" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold">Travel CRM</h2>
            <p className="truncate text-xs text-muted-foreground">Travel Management Platform</p>
          </div>
        )}
      </div>
      {showToggle && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Maximize sidebar" : "Minimize sidebar"}
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {collapsed ? <FaChevronRight className="h-4 w-4" /> : <FaChevronLeft className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}

// TODO: no notifications backend/feed exists yet — this is a UI placeholder.
// Wire `hasUnread` to a real unread-count selector once that feature lands.
function NotificationsLink({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const active = pathname === "/notifications" || pathname.startsWith("/notifications/");
  const hasUnread = false;

  return (
    <Link
      href="/notifications"
      title={collapsed ? "Notifications" : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-xl p-2.5 text-sm font-medium transition-colors",
        collapsed ? "w-auto justify-center" : "w-full",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <span className="relative shrink-0">
        <PiBellFill className="h-4 w-4" />
        {hasUnread && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-danger ring-2 ring-card" aria-hidden="true" />
        )}
      </span>
      {!collapsed && <span>Notifications</span>}
    </Link>
  );
}

function SidebarFooter({ collapsed, loggingOut, onLogout }: { collapsed: boolean; loggingOut: boolean; onLogout: () => void }) {
  return (
    <div className={cn("p-4", collapsed && "flex flex-col items-center gap-1 p-2")}>
      <NotificationsLink collapsed={collapsed} />
      <button
        onClick={onLogout}
        disabled={loggingOut}
        title={collapsed ? "Logout" : undefined}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl p-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50",
          collapsed && "w-auto justify-center",
        )}
      >
        <FaPowerOff className="h-4 w-4 shrink-0" />
        {!collapsed && <span>{loggingOut ? "Logging out…" : "Logout"}</span>}
      </button>
      {!collapsed && <p className="mt-1 text-center text-xs text-muted-foreground">Travel CRM v{pkg.version}</p>}
    </div>
  );
}

export function Sidebar({ roles }: { roles: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const mobileOpen = useAppSelector((state) => state.ui.mobileOpen);
  const [loggingOut, setLoggingOut] = useState(false);
  // Desktop "peek" overlay — always starts closed, never persisted: it's a
  // temporary panel on top of the page, not a permanent layout mode, so
  // there's nothing to remember across page loads.
  const [expanded, setExpanded] = useState(false);
  // Which groups' routes show in the overlay panel — each toggled
  // independently by clicking its header (or opened by clicking its icon on
  // the collapsed rail), and stays open until the user collapses it again.
  const [openGroupIds, setOpenGroupIds] = useState<Set<string>>(new Set());

  function toggleGroup(groupId: string) {
    setOpenGroupIds((current) => {
      const next = new Set(current);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  function openGroup(groupId: string) {
    setOpenGroupIds((current) => new Set(current).add(groupId));
  }

  const groups = visibleGroupsForRoles(roles).filter((group) => ["sales", "library", "organization"].includes(group.id));

  useEffect(() => {
    dispatch(closeMobileAction());
    setExpanded(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Whenever the overlay panel is fully closed — navigation, Escape, backdrop
  // click, or the collapse handle — forget which groups were open, so the
  // next time a rail icon is clicked only that group's submenu shows.
  useEffect(() => {
    if (!expanded && !mobileOpen) {
      setOpenGroupIds(new Set());
    }
  }, [expanded, mobileOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setExpanded(false);
        dispatch(closeMobileAction());
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);

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
      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => dispatch(closeMobileAction())} aria-hidden="true" />
      )}
      {/* Desktop overlay backdrop — only while the peek panel is open */}
      {expanded && (
        <div className="fixed inset-0 z-40 hidden bg-black/30 md:block" onClick={() => setExpanded(false)} aria-hidden="true" />
      )}

      {/* Permanently-reserved icon rail — desktop only, fixed w-20 always.
          This is what keeps the main layout from ever shifting: its width
          never changes, regardless of the overlay's open/closed state. */}
      <aside className="relative hidden shrink-0 md:flex md:w-14 md:flex-col md:border-r md:bg-card">
        <SidebarBrand collapsed showToggle={false} onToggle={() => setExpanded(true)} />
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Expand sidebar"
          title="Expand sidebar"
          className="absolute right-0 top-1/2 z-10 hidden h-8 w-5 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-r-md border border-l-0 border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground md:flex"
        >
          <FaChevronRight className="h-3 w-3" />
        </button>
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <div className="flex flex-col gap-1">
            <NavLink path={dashboardRoute.path} title={dashboardRoute.title} Icon={dashboardRoute.icon} collapsed />
          </div>
          <div className="mt-4 flex flex-col items-center gap-2">
            {groups.map((group) => (
              <CollapsedGroupIcon
                key={group.id}
                group={group}
                onExpand={() => {
                  openGroup(group.id);
                  setExpanded(true);
                }}
              />
            ))}
          </div>
        </div>
        <SidebarFooter collapsed loggingOut={loggingOut} onLogout={handleLogout} />
      </aside>

      {/* Overlay panel — fixed, always on top of the page, never part of the
          layout flow. Serves both roles: the mobile drawer (driven by
          mobileOpen) and the desktop "peek" (driven by expanded); its
          content is always the full/labeled rendering either way. */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(19rem,calc(100vw-2rem))] flex-col border-r bg-card shadow-xl transition-transform duration-300 md:w-72 md:duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          expanded && "md:translate-x-0",
        )}
      >
        <SidebarBrand
          collapsed={false}
          showToggle={false}
          onToggle={() => {
            setExpanded(false);
            dispatch(closeMobileAction());
          }}
        />
        <button
          type="button"
          onClick={() => {
            setExpanded(false);
            dispatch(closeMobileAction());
          }}
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
          className={cn(
            "absolute right-0 top-1/2 z-10 hidden h-8 w-5 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-r-md border border-l-0 border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground",
            expanded && "md:flex",
          )}
        >
          <FaChevronLeft className="h-3 w-3" />
        </button>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="flex flex-col gap-1">
            <NavLink path={dashboardRoute.path} title={dashboardRoute.title} Icon={dashboardRoute.icon} collapsed={false} />
          </div>
          {groups.map((group) => (
            <ExpandedGroup
              key={group.id}
              group={group}
              isOpen={openGroupIds.has(group.id)}
              onToggle={() => toggleGroup(group.id)}
            />
          ))}
        </div>
        <SidebarFooter collapsed={false} loggingOut={loggingOut} onLogout={handleLogout} />
      </aside>
    </>
  );
}
