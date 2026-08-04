import { redirect } from "next/navigation";
import { serverApi } from "@/lib/axios/serverClient";

// Statuses the Fetch API spec forbids attaching a body to — constructing a
// Response with a non-null body at one of these would throw.
const NULL_BODY_STATUSES = new Set([204, 205, 304]);

// Every existing route.ts caller treats this as a Fetch API Response
// (res.status / res.ok / res.json()) — that contract is preserved exactly
// so none of the ~85 files that call backendFetch/backendJson need to
// change. Only the transport underneath (axios via serverApi, not the
// global fetch) is new.
export async function backendFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const headerObj: Record<string, string> = {};
  headers.forEach((value, key) => {
    headerObj[key] = value;
  });

  const res = await serverApi.request<string>({
    url: path,
    method: init.method ?? "GET",
    data: init.body as string | undefined,
    headers: headerObj,
  });

  const body = NULL_BODY_STATUSES.has(res.status) ? null : res.data || null;

  return new Response(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function backendJson<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await backendFetch(path, init);

  if (!res.ok) {
    const body = await res.json().catch(() => null);

    // JWT expired / invalid / unauthorized
    if (res.status === 401) {
      redirect("/login");
    }

    throw new Error(
      body?.message ?? `Request to ${path} failed (${res.status})`
    );
  }

  return res.json();
}
