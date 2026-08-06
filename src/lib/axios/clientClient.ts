"use client";

import axios from "axios";

// Browser-only. Same-origin base URL — the session cookie rides along
// automatically, no manual auth header needed (the local /api/* route
// handlers read the httpOnly cookie server-side and forward it to the
// actual backend via backendFetch). Replaces the ~88 component-level
// fetch("/api/...") call sites.
export const clientApi = axios.create({ baseURL: "/api" });

clientApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 here means a stale/expired session slipped past middleware's
    // cookie-presence check (the cookie exists but the backend rejected the
    // JWT). No router instance is available inside an interceptor, so this
    // is a hard navigation rather than client-side routing.
    //
    // The /login call itself is excluded: a 401 there just means the
    // submitted credentials were wrong, not a stale session, and the login
    // page needs to handle that in place (inline error) rather than being
    // hard-navigated away mid-render.
    if (axios.isAxiosError(error) && error.response?.status === 401 && error.config?.url !== "/login") {
      window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);
