import type { ReactElement } from "react";
import type { IconType } from "react-icons";
import { RxDashboard } from "react-icons/rx";
import { LiaCogSolid, LiaUserSolid } from "react-icons/lia";
import { PiBuildings, PiSuitcaseRolling, PiUsersThree, PiMapPin, PiAirplaneTilt, PiReceipt, PiMegaphone, PiCurrencyDollar, PiCreditCard, PiFileText, PiClock, PiCheckCircle, PiMapTrifold, PiFlagCheckered } from "react-icons/pi";
import { TbShoppingBagSearch, TbBus, TbHotelService, TbKayak, TbCalendarCheck, TbMessageQuestion, TbFileInvoice, TbForms, TbSpeakerphone } from "react-icons/tb";
import EscapePoints from "../features/library/Pages/EscapePoints";
import TripSource from "../features/library/Pages/TripSource";
import Profile from "../features/Profile/Pages/Profile";
import ComingSoonPage from "../features/common/Pages/ComingSoonPage";

export interface AppRoute {
  path: string;
  title: string;
  icon: IconType;
  element: ReactElement;
}

export interface RouteGroup {
  id: string;
  title: string;
  icon: IconType;
  routes: AppRoute[];
}

const placeholder = (title: string, section: string, icon: IconType) => (
  <ComingSoonPage title={title} section={section} icon={icon} />
);

export const dashboardRoute: AppRoute = {
  path: "/dashboard", title: "Dashboard", icon: RxDashboard,
  element: placeholder("Dashboard", "Overview", RxDashboard),
};

export const routeGroups: RouteGroup[] = [
  { id: "organization", title: "Organization", icon: PiBuildings, routes: [
    { path: "/destinations", title: "Destinations", icon: PiMapPin, element: <EscapePoints /> },
    { path: "/trip-sources", title: "Trip Sources", icon: TbShoppingBagSearch, element: <TripSource /> },
    { path: "/team-members", title: "Team Members", icon: PiUsersThree, element: placeholder("Team Members", "Organization", PiUsersThree) },
    { path: "/settings", title: "Settings", icon: LiaCogSolid, element: placeholder("Settings", "Organization", LiaCogSolid) },
  ]},
  { id: "services", title: "Services", icon: PiSuitcaseRolling, routes: [
    { path: "/services/transport", title: "Transport", icon: TbBus, element: placeholder("Transport", "Services", TbBus) },
    { path: "/services/hotels", title: "Hotels", icon: TbHotelService, element: placeholder("Hotels", "Services", TbHotelService) },
    { path: "/services/travel-activities", title: "Travel Activities", icon: TbKayak, element: placeholder("Travel Activities", "Services", TbKayak) },
  ]},
  { id: "trips", title: "Trips", icon: PiAirplaneTilt, routes: [
    { path: "/trips/in-progress", title: "In Progress", icon: PiClock, element: placeholder("In Progress", "Trips", PiClock) },
    { path: "/trips/converted", title: "Converted", icon: PiCheckCircle, element: placeholder("Converted", "Trips", PiCheckCircle) },
    { path: "/trips/on-trip", title: "On Trip", icon: PiMapTrifold, element: placeholder("On Trip", "Trips", PiMapTrifold) },
    { path: "/trips/last-trip", title: "Last Trip", icon: PiFlagCheckered, element: placeholder("Last Trip", "Trips", PiFlagCheckered) },
  ]},
  { id: "requests", title: "Requests", icon: TbMessageQuestion, routes: [
    { path: "/requests/trip-plans", title: "Trip Plan Requests", icon: TbCalendarCheck, element: placeholder("Trip Plan Requests", "Requests", TbCalendarCheck) },
    { path: "/requests/quotations", title: "Quotation Requests", icon: TbFileInvoice, element: placeholder("Quotation Requests", "Requests", TbFileInvoice) },
    { path: "/requests/custom-enquiries", title: "Custom Enquiries", icon: TbForms, element: placeholder("Custom Enquiries", "Requests", TbForms) },
  ]},
  { id: "bookings", title: "Bookings", icon: TbCalendarCheck, routes: [
    { path: "/bookings", title: "All Bookings", icon: TbCalendarCheck, element: placeholder("Bookings", "Bookings", TbCalendarCheck) },
  ]},
  { id: "finance", title: "Finance", icon: PiCurrencyDollar, routes: [
    { path: "/finance/quotations", title: "Quotations", icon: PiFileText, element: placeholder("Quotations", "Finance", PiFileText) },
    { path: "/finance/invoices", title: "Invoices", icon: PiReceipt, element: placeholder("Invoices", "Finance", PiReceipt) },
    { path: "/finance/payments", title: "Payments", icon: PiCreditCard, element: placeholder("Payments", "Finance", PiCreditCard) },
  ]},
  { id: "marketing", title: "Marketing", icon: PiMegaphone, routes: [
    { path: "/marketing/lead-sources", title: "Lead Sources", icon: TbSpeakerphone, element: placeholder("Lead Sources", "Marketing", TbSpeakerphone) },
  ]},
];

export const profileRoute: AppRoute = { path: "/profile", title: "Profile", icon: LiaUserSolid, element: <Profile /> };
export const protectedRoutes: AppRoute[] = [dashboardRoute, ...routeGroups.flatMap((group) => group.routes), profileRoute];

export const findRouteByPath = (pathname: string) =>
  [...protectedRoutes].sort((a, b) => b.path.length - a.path.length).find((route) => pathname === route.path || pathname.startsWith(`${route.path}/`));

export default protectedRoutes;
