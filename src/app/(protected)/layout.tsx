import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AuthHydrator } from "@/features/auth/AuthHydrator";
import { getCurrentUser, roleNames } from "@/lib/current-user";

// Route protection itself lives in middleware.ts (redirects to /login when
// the session cookie is missing) — this layout is just the authenticated shell.
// Nav visibility is role-based (Section 4 of the spec): groups are hidden
// entirely for roles that shouldn't see them, not just greyed out, so the
// current user's roles are resolved here, server-side, once per request.
export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const roles = roleNames(user);

  return (
    <>
      <AuthHydrator user={user} roles={roles} />
      <div className="flex h-full">
        <Sidebar roles={roles} />
        <div className="flex flex-1 flex-col min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-2">{children}</main>
        </div>
      </div>
    </>
  );
}
