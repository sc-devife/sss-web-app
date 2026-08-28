import type { IconType } from "react-icons";
import { RxDashboard } from "react-icons/rx";
import { LiaUserSolid } from "react-icons/lia";
import {
  PiFunnelFill,
  PiGitForkFill,
  PiAirplaneTiltFill,
  PiMapPinFill,
  PiStorefrontFill,
  PiBedFill,
  PiBooksFill,
  PiBuildingOfficeFill,
  PiUsersThreeFill,
  PiUsersFourFill,
  //PiShieldCheckFill,
  PiBankFill,
  PiFileTextFill,
  PiGearSixFill,
  PiGlobeFill,
  PiHandshakeFill,
  PiScrollFill,
  PiForkKnifeFill,
  PiDoorOpenFill,
} from "react-icons/pi";
import { TbKayak, TbBusFilled, TbRoute, TbPlug } from "react-icons/tb";
import { FaBuildingUser } from "react-icons/fa6";

// Nav is a plain data structure — the sidebar renders from it, and each
// `path` maps 1:1 onto an `app/(protected)/<path>/page.tsx` route. Adding a
// module later means adding an entry here, not restructuring the sidebar.
// `visibleToRoles` omitted = visible to every role; present = only those
// role names see the group/item at all (not just greyed out).
export interface AppRoute {
  path: string;
  title: string;
  icon: IconType;
}

export interface RouteGroup {
  id: string;
  title: string;
  icon: IconType;
  routes: AppRoute[];
  visibleToRoles?: string[];
}

export const dashboardRoute: AppRoute = {
  path: "/dashboard",
  title: "Dashboard",
  icon: RxDashboard,
};

export const routeGroups: RouteGroup[] = [
  {
    id: "sales",
    title: "Sales",
    icon: PiHandshakeFill,
    routes: [
      { path: "/leads", title: "Leads", icon: PiFunnelFill },
      { path: "/leads/sources", title: "Lead Sources", icon: PiGitForkFill },
      { path: "/escapes", title: "Escapes", icon: PiAirplaneTiltFill },
    ],
  },
  {
    id: "library",
    title: "Library",
    icon: PiBooksFill,
    routes: [
      { path: "/library/hotels", title: "Hotels", icon: PiBedFill },
      { path: "/library/escape-points", title: "Escape Points", icon: PiMapPinFill },
      { path: "/library/activities", title: "Activities", icon: TbKayak },
      { path: "/library/transport", title: "Transport", icon: TbBusFilled },
      { path: "/library/service-providers", title: "Service Providers", icon: PiStorefrontFill },
      { path: "/library/meal-plans", title: "Meal Plans", icon: PiForkKnifeFill },
      { path: "/library/room-types", title: "Room Types", icon: PiDoorOpenFill },
      { path: "/library/terms-inclusions", title: "Terms, Inclusions & Exclusions", icon: PiScrollFill },
    ],
  },
  {
    id: "administration",
    title: "Administration",
    icon: FaBuildingUser,
    visibleToRoles: ["SUPER_ADMIN", "ADMIN"],
    routes: [
      { path: "/administration/organization", title: "Organization", icon: PiBuildingOfficeFill },
      { path: "/administration/users", title: "Users", icon: PiUsersThreeFill },
      { path: "/administration/teams", title: "Teams", icon: PiUsersFourFill },
      //{ path: "/administration/roles", title: "Roles", icon: PiShieldCheckFill },
      { path: "/administration/bank-accounts", title: "Bank Accounts", icon: PiBankFill },
      { path: "/administration/assignment-rules", title: "Assignment Rules", icon: TbRoute },
      { path: "/administration/integrations", title: "Integrations", icon: TbPlug },
      { path: "/administration/templates", title: "Quote/Invoice Templates", icon: PiFileTextFill },
      { path: "/administration/settings", title: "Settings", icon: PiGearSixFill },
    ],
  },
  {
    id: "platform",
    title: "Platform",
    icon: PiGlobeFill,
    visibleToRoles: ["SUPER_ADMIN"],
    routes: [
      { path: "/platform/organizations", title: "Organizations", icon: PiBuildingOfficeFill },
      { path: "/platform/settings", title: "Platform Settings", icon: PiGearSixFill },
    ],
  },
];

export const profileRoute: AppRoute = { path: "/profile", title: "Profile", icon: LiaUserSolid };

export const protectedRoutes: AppRoute[] = [
  dashboardRoute,
  ...routeGroups.flatMap((group) => group.routes),
  profileRoute,
];

export const findRouteByPath = (pathname: string) =>
  [...protectedRoutes]
    .sort((a, b) => b.path.length - a.path.length)
    .find((route) => pathname === route.path || pathname.startsWith(`${route.path}/`));

/** Route plus its owning group title, for stub pages that need both (e.g. "Hotels" / "Library"). */
export const findRouteWithGroup = (path: string): { route: AppRoute; groupTitle: string } | undefined => {
  if (path === dashboardRoute.path) return { route: dashboardRoute, groupTitle: "Overview" };
  if (path === profileRoute.path) return { route: profileRoute, groupTitle: "Account" };
  for (const group of routeGroups) {
    const route = group.routes.find((r) => r.path === path);
    if (route) return { route, groupTitle: group.title };
  }
  return undefined;
};

/** Groups visible to a user holding any of these role names (case-insensitive). */
export const visibleGroupsForRoles = (roleNames: string[]): RouteGroup[] => {
  const normalized = new Set(roleNames.map((r) => r.toUpperCase()));
  return routeGroups.filter(
    (group) => !group.visibleToRoles || group.visibleToRoles.some((r) => normalized.has(r)),
  );
};
