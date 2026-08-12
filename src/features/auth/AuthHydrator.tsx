"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setLoggedInUser } from "@/features/auth/authSlice";
import type { CurrentUser } from "@/lib/current-user";

// Restores the Redux auth state from the server-resolved current user (see
// (protected)/layout.tsx) on every protected-page load/refresh — this is
// what keeps the Header showing the right user/org logo after a refresh,
// without ever reading from localStorage. Renders nothing.
export function AuthHydrator({ user, roles }: { user: CurrentUser; roles: string[] }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(
      setLoggedInUser({
        userId: user.userId,
        name: user.name,
        firstName: user.first_name,
        lastName: user.last_name,
        role: roles.join(","),
        organizationLogo: user.organizationLogo,
        profilePicture: user.profile_picture,
      }),
    );
  }, [dispatch, user, roles]);

  return null;
}
