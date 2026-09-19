import type { IconType } from "react-icons";
import { LiaUsersCogSolid, LiaUserSolid } from "react-icons/lia";
import {
  PiSquaresFour,
  PiSquaresFourFill,
  PiFunnel,
  PiFunnelFill,
  PiGitFork,
  PiGitForkFill,
  PiMapPin,
  PiMapPinFill,
  PiStorefront,
  PiStorefrontFill,
  PiBooks,
  PiBooksFill,
  PiBuildingOffice,
  PiBuildingOfficeFill,
  PiUsersThree,
  PiUsersThreeFill,
  PiUsersFour,
  PiUsersFourFill,
  //PiShieldCheckFill,
  PiBank,
  PiBankFill,
  PiFileText,
  PiFileTextFill,
  PiGearSix,
  PiGearSixFill,
  PiGlobe,
  PiGlobeFill,
  PiHandshake,
  PiHandshakeFill,
  PiScroll,
  PiScrollFill,
  PiForkKnife,
  PiForkKnifeFill,
  PiDoorOpen,
  PiDoorOpenFill,
  PiCalculator,
  PiCalculatorFill,
  PiReceipt,
  PiReceiptFill,
  PiSparkle,
  PiSparkleFill,
  PiMountains,
  PiMountainsFill,
  PiCar,
  PiCarFill,
  PiBellFill,
  PiPersonSimpleWalkBold,
} from "react-icons/pi";
import { MdOutlineHotel, MdHotel } from "react-icons/md";
import { BsPlug, BsPlugFill, BsInboxes, BsInboxesFill, BsBuildingGear, BsBuildingFillGear } from "react-icons/bs";
import { FaPersonWalkingLuggage } from "react-icons/fa6";
import { FaUsersCog } from "react-icons/fa";

// Nav is a plain data structure — the sidebar renders from it, and each
// `path` maps 1:1 onto an `app/(protected)/<path>/page.tsx` route. Adding a
// module later means adding an entry here, not restructuring the sidebar.
// `visibleToRoles` omitted = visible to every role; present = only those
// role names see the group/item at all (not just greyed out).
//
// `icon` is the outline (inactive) glyph; `activeIcon` its filled twin, shown
// while the route (or, on the collapsed rail, its group) is active.
// activeIcon is optional on AppRoute because routes with no sidebar presence
// (profile, follow-ups, notifications) don't need one — consumers fall back
// to `icon`.
export interface AppRoute {
  path: string;
  title: string;
  icon: IconType;
  activeIcon?: IconType;
}

export interface RouteGroup {
  id: string;
  title: string;
  icon: IconType;
  activeIcon: IconType;
  routes: AppRoute[];
  visibleToRoles?: string[];
}

export const dashboardRoute: AppRoute = {
  path: "/dashboard",
  title: "Dashboard",
  icon: PiSquaresFour,
  activeIcon: PiSquaresFourFill,
};

export const routeGroups: RouteGroup[] = [
  {
    id: "sales",
    title: "Sales",
    icon: PiHandshake,
    activeIcon: PiHandshakeFill,
    routes: [
      { path: "/leads", title: "Leads", icon: PiFunnel, activeIcon: PiFunnelFill },
      { path: "/leads/sources", title: "Lead Sources", icon: PiGitFork, activeIcon: PiGitForkFill },
      { path: "/escapes", title: "Escapes", icon: PiPersonSimpleWalkBold, activeIcon: FaPersonWalkingLuggage },
    ],
  },
  {
    id: "library",
    title: "Library",
    icon: PiBooks,
    activeIcon: PiBooksFill,
    routes: [
      { path: "/library/hotels", title: "Hotels", icon: MdOutlineHotel, activeIcon: MdHotel },
      { path: "/library/escape-points", title: "Escape Points", icon: PiMapPin, activeIcon: PiMapPinFill },
      { path: "/library/activities", title: "Activities", icon: PiMountains, activeIcon: PiMountainsFill },
      { path: "/library/transport", title: "Transport", icon: PiCar, activeIcon: PiCarFill },
      { path: "/library/service-providers", title: "Service Providers", icon: PiStorefront, activeIcon: PiStorefrontFill },
      { path: "/library/meal-plans", title: "Meal Plans", icon: PiForkKnife, activeIcon: PiForkKnifeFill },
      { path: "/library/room-types", title: "Room Types", icon: PiDoorOpen, activeIcon: PiDoorOpenFill },
      { path: "/library/services", title: "Services", icon: PiSparkle, activeIcon: PiSparkleFill },
      { path: "/library/terms-inclusions", title: "Terms, Inclusions & Exclusions", icon: PiScroll, activeIcon: PiScrollFill },
    ],
  },
  {
    id: "administration",
    title: "Administration",
    icon: BsBuildingGear,
    activeIcon: BsBuildingFillGear,
    visibleToRoles: ["SUPER_ADMIN", "ADMIN"],
    routes: [
      { path: "/administration/organization", title: "Organization", icon: PiBuildingOffice, activeIcon: PiBuildingOfficeFill },
      { path: "/administration/users", title: "Users", icon: PiUsersThree, activeIcon: PiUsersThreeFill },
      { path: "/administration/teams", title: "Teams", icon: PiUsersFour, activeIcon: PiUsersFourFill },
      //{ path: "/administration/roles", title: "Roles", icon: PiShieldCheckFill },
      { path: "/administration/bank-accounts", title: "Bank Accounts", icon: PiBank, activeIcon: PiBankFill },
      { path: "/administration/assignment-rules", title: "Assignment Rules", icon: LiaUsersCogSolid, activeIcon: FaUsersCog },
      { path: "/administration/integrations", title: "Integrations", icon: BsPlug, activeIcon: BsPlugFill },
      { path: "/administration/templates", title: "Quotation Templates", icon: PiFileText, activeIcon: PiFileTextFill },
      { path: "/administration/settings", title: "Settings", icon: PiGearSix, activeIcon: PiGearSixFill },
    ],
  },
  {
    id: "accounting",
    title: "Accounting",
    icon: PiCalculator,
    activeIcon: PiCalculatorFill,
    // Financial ledger data — gated the same way as the other
    // money-adjacent Administration screens (e.g. Bank Accounts).
    visibleToRoles: ["SUPER_ADMIN", "ADMIN"],
    // Incoming/Outgoing were split into their own nav items initially, but
    // that's really just a filter on one combined ledger — kept as a single
    // "Transactions" route; incoming/outgoing become filters inside it.
    routes: [
      { path: "/accounting/transactions", title: "Transactions", icon: PiReceipt, activeIcon: PiReceiptFill },
    ],
  },
  {
    id: "platform",
    title: "Platform",
    icon: PiGlobe,
    activeIcon: PiGlobeFill,
    visibleToRoles: ["SUPER_ADMIN"],
    routes: [
      { path: "/platform/organizations", title: "Organizations", icon: PiBuildingOffice, activeIcon: PiBuildingOfficeFill },
      { path: "/platform/settings", title: "Platform Settings", icon: PiGearSix, activeIcon: PiGearSixFill },
    ],
  },
];

export const profileRoute: AppRoute = { path: "/profile", title: "Profile", icon: LiaUserSolid };

// Reached via the header's Follow-up icon (Header.tsx), not the sidebar —
// same "own route, no sidebar group" shape as profileRoute.
export const followUpsRoute: AppRoute = { path: "/follow-ups", title: "Follow-ups", icon: BsInboxes, activeIcon: BsInboxesFill };

// Reached via the sidebar's bell icon (NotificationBell), not a sidebar nav
// item itself — same shape as followUpsRoute/profileRoute.
export const notificationsRoute: AppRoute = { path: "/notifications", title: "Notifications", icon: PiBellFill };

export const protectedRoutes: AppRoute[] = [
  dashboardRoute,
  ...routeGroups.flatMap((group) => group.routes),
  profileRoute,
  followUpsRoute,
  notificationsRoute,
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
