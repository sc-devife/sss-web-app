import type { IconType } from "react-icons";
import { RxDashboard } from "react-icons/rx";
import { LiaCogSolid, LiaUserSolid } from "react-icons/lia";
import {
  PiBuildings,
  PiSuitcaseRolling,
  PiUsersThree,
  PiMapPin,
  PiAirplaneTilt,
  PiReceipt,
  PiMegaphone,
  PiCurrencyDollar,
  PiCreditCard,
  PiFileText,
  PiClock,
  PiCheckCircle,
  PiMapTrifold,
  PiFlagCheckered,
} from "react-icons/pi";
import {
  TbShoppingBagSearch,
  TbBus,
  TbHotelService,
  TbKayak,
  TbCalendarCheck,
  TbMessageQuestion,
  TbFileInvoice,
  TbForms,
  TbSpeakerphone,
} from "react-icons/tb";

// Nav is a plain data structure — the sidebar renders from it, and each
// `path` maps 1:1 onto an `app/(protected)/<path>/page.tsx` route. Adding a
// module later means adding an entry here, not restructuring the sidebar.
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
}

export const dashboardRoute: AppRoute = {
  path: "/dashboard",
  title: "Dashboard",
  icon: RxDashboard,
};

export const routeGroups: RouteGroup[] = [
  {
    id: "organization",
    title: "Organization",
    icon: PiBuildings,
    routes: [
      { path: "/destinations", title: "Destinations", icon: PiMapPin },
      { path: "/trip-sources", title: "Trip Sources", icon: TbShoppingBagSearch },
      { path: "/team-members", title: "Team Members", icon: PiUsersThree },
      { path: "/settings", title: "Settings", icon: LiaCogSolid },
    ],
  },
  {
    id: "services",
    title: "Services",
    icon: PiSuitcaseRolling,
    routes: [
      { path: "/services/transport", title: "Transport", icon: TbBus },
      { path: "/services/hotels", title: "Hotels", icon: TbHotelService },
      { path: "/services/travel-activities", title: "Travel Activities", icon: TbKayak },
    ],
  },
  {
    id: "trips",
    title: "Trips",
    icon: PiAirplaneTilt,
    routes: [
      { path: "/trips/in-progress", title: "In Progress", icon: PiClock },
      { path: "/trips/converted", title: "Converted", icon: PiCheckCircle },
      { path: "/trips/on-trip", title: "On Trip", icon: PiMapTrifold },
      { path: "/trips/last-trip", title: "Last Trip", icon: PiFlagCheckered },
    ],
  },
  {
    id: "requests",
    title: "Requests",
    icon: TbMessageQuestion,
    routes: [
      { path: "/requests/trip-plans", title: "Trip Plan Requests", icon: TbCalendarCheck },
      { path: "/requests/quotations", title: "Quotation Requests", icon: TbFileInvoice },
      { path: "/requests/custom-enquiries", title: "Custom Enquiries", icon: TbForms },
    ],
  },
  {
    id: "bookings",
    title: "Bookings",
    icon: TbCalendarCheck,
    routes: [{ path: "/bookings", title: "All Bookings", icon: TbCalendarCheck }],
  },
  {
    id: "finance",
    title: "Finance",
    icon: PiCurrencyDollar,
    routes: [
      { path: "/finance/quotations", title: "Quotations", icon: PiFileText },
      { path: "/finance/invoices", title: "Invoices", icon: PiReceipt },
      { path: "/finance/payments", title: "Payments", icon: PiCreditCard },
    ],
  },
  {
    id: "marketing",
    title: "Marketing",
    icon: PiMegaphone,
    routes: [{ path: "/marketing/lead-sources", title: "Lead Sources", icon: TbSpeakerphone }],
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

/** Route plus its owning group title, for stub pages that need both (e.g. "Hotels" / "Services"). */
export const findRouteWithGroup = (path: string): { route: AppRoute; groupTitle: string } | undefined => {
  if (path === dashboardRoute.path) return { route: dashboardRoute, groupTitle: "Overview" };
  if (path === profileRoute.path) return { route: profileRoute, groupTitle: "Account" };
  for (const group of routeGroups) {
    const route = group.routes.find((r) => r.path === path);
    if (route) return { route, groupTitle: group.title };
  }
  return undefined;
};
