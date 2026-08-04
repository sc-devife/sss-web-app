import type { IconType } from "react-icons";
import { RxDashboard } from "react-icons/rx";
import { LiaUserSolid } from "react-icons/lia";
import {
  PiUserPlus,
  PiAirplaneTilt,
  PiMapPin,
  PiSuitcaseRolling,
  PiBuildingOffice,
  PiUsersThree,
  //PiShieldCheck,
  PiCreditCard,
  PiFileText,
  PiGearSix,
  PiGlobe,
  PiStackSimple,
  PiHandshake,
  PiScroll,
} from "react-icons/pi";
import { TbHotelService, TbKayak, TbBus, TbRoute, TbPlug } from "react-icons/tb";

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
    icon: PiHandshake,
    routes: [
      { path: "/leads", title: "Leads", icon: PiUserPlus },
      { path: "/leads/sources", title: "Lead Sources", icon: TbPlug },
      { path: "/trips", title: "Trips", icon: PiAirplaneTilt },
    ],
  },
  {
    id: "library",
    title: "Library",
    icon: PiStackSimple,
    routes: [
      { path: "/library/hotels", title: "Hotels", icon: TbHotelService },
      { path: "/library/destinations", title: "Destinations", icon: PiMapPin },
      { path: "/library/activities", title: "Activities", icon: TbKayak },
      { path: "/library/transport", title: "Transport", icon: TbBus },
      { path: "/library/service-providers", title: "Service Providers", icon: PiSuitcaseRolling },
      { path: "/library/terms-inclusions", title: "Terms, Inclusions & Exclusions", icon: PiScroll },
    ],
  },
  {
    id: "organization",
    title: "Organization",
    icon: PiBuildingOffice,
    visibleToRoles: ["SUPER_ADMIN", "ADMIN"],
    routes: [
      { path: "/organization/profile", title: "Profile", icon: PiBuildingOffice },
      { path: "/organization/users", title: "Users", icon: PiUsersThree },
      //{ path: "/organization/roles", title: "Roles", icon: PiShieldCheck },
      { path: "/organization/bank-accounts", title: "Bank Accounts", icon: PiCreditCard },
      { path: "/organization/assignment-rules", title: "Assignment Rules", icon: TbRoute },
      { path: "/organization/integrations", title: "Integrations", icon: TbPlug },
      { path: "/organization/templates", title: "Quote/Invoice Templates", icon: PiFileText },
      { path: "/organization/settings", title: "Settings", icon: PiGearSix },
    ],
  },
  {
    id: "platform",
    title: "Platform",
    icon: PiGlobe,
    visibleToRoles: ["SUPER_ADMIN"],
    routes: [
      { path: "/platform/organizations", title: "Organizations", icon: PiBuildingOffice },
      { path: "/platform/settings", title: "Platform Settings", icon: PiGearSix },
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
