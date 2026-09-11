"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setLoggedInUser } from "@/features/auth/authSlice";
import { setSoundEnabled } from "@/features/notifications/notificationsSlice";
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
        organizationName: user.organizationName,
        organizationLogoShape: user.organizationLogoShape,
        profilePicture: user.profile_picture,
      }),
    );
    // Defaults true (matches the backend column's own default) when the
    // field hasn't hydrated yet on an older cached response shape.
    dispatch(setSoundEnabled(user.notificationSoundEnabled ?? true));
  }, [dispatch, user, roles]);

  return null;
}
