// Minimal fetch wrapper for the client-side calls that need it directly (e.g.
// login, before any session exists). Server Components/Route Handlers should
// talk to the backend with their own server-side fetch, not this — this one
// carries no cookies/credentials logic for SSR, only browser use.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/sss";

export interface LoginResponse {
  token: string;
  userId: string;
  name: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/api/login/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(typeof body === "string" ? body : body?.message ?? "Login failed");
  }

  return res.json();
}
