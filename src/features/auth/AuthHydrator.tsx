"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setCurrentUser } from "@/features/auth/authSlice";
import type { CurrentUser } from "@/lib/current-user";

// Seeds authSlice from the server-resolved current user (see
// (protected)/layout.tsx) so client components can read it via
// useAppSelector instead of prop-drilling. Renders nothing.
export function AuthHydrator({ user, roles }: { user: CurrentUser; roles: string[] }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setCurrentUser({ user, roles }));
  }, [dispatch, user, roles]);

  return null;
}
