import { redirect } from "next/navigation";

// This app is the CRM product itself (app.demo.com) — marketing/landing
// content lives on the separate company site (demo.com). "/" is no longer
// a public marketing page; middleware.ts now treats it like any other
// authenticated route, so this only ever renders for a visitor who already
// has a session (an unauthenticated one is redirected to /login before
// reaching here) — send them straight to the dashboard.
export default function RootPage() {
  redirect("/dashboard");
}
