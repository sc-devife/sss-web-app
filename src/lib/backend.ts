import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session";

// Server-only. Attaches the session cookie's JWT as a Bearer header when
// calling the Spring Boot backend — Server Components and Route Handlers
// use this so the token never has to be exposed to client-side JS.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/sss";

export async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  return fetch(`${API_BASE_URL}${path}`, { ...init, headers, cache: "no-store" });
}

export async function backendJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await backendFetch(path, init);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Request to ${path} failed (${res.status})`);
  }
  return res.json();
}
