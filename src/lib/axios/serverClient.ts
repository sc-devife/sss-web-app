import axios from "axios";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/sss";

// Server-only. Used exclusively by backendFetch/backendJson (src/lib/backend.ts)
// inside Route Handlers and Server Components — never imported by a "use
// client" file. responseType "text" + validateStatus always-true mirror
// native fetch()'s behavior exactly: the raw body text is handed back
// unparsed (so backendFetch can construct a real Response whose .json()
// behaves identically to before), and HTTP error statuses resolve normally
// instead of throwing, since callers inspect res.status/res.ok themselves.
export const serverApi = axios.create({
  baseURL: API_BASE_URL,
  responseType: "text",
  validateStatus: () => true,
});

serverApi.interceptors.request.use((config) => {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["Cache-Control"] = "no-store";
  return config;
});
