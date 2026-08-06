import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import { serverApi } from "@/lib/axios/serverClient";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // matches the backend's 12h JWT expiry

function parseJson(text: string | undefined | null) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Proxies login to the Spring Boot backend and sets the JWT as an httpOnly
// cookie, so the token never touches client-side JS/localStorage.
export async function POST(request: Request) {
  const { email, password } = await request.json();

  let backendRes;
  try {
    // Timeout scoped to this call only — serverApi has no default timeout,
    // and a hung/unreachable backend should surface quickly as "unavailable"
    // rather than leave the login request pending indefinitely.
    backendRes = await serverApi.post<string>("/api/login/user", { email, password }, { timeout: 10000 });
  } catch {
    // serverApi resolves (never throws) for real HTTP error responses
    // (validateStatus is always-true) — so getting here means the backend
    // was unreachable (stopped, connection refused, timed out), not that it
    // rejected the credentials. Distinct 503 status lets the client tell
    // "server unavailable" apart from "invalid credentials".
    return NextResponse.json(
      { message: "Unable to connect to the server. Please try again later." },
      { status: 503 },
    );
  }

  if (backendRes.status < 200 || backendRes.status >= 300) {
    const body = parseJson(backendRes.data);
    const message = typeof body === "string" ? body : (body?.message ?? "Invalid credentials");
    return NextResponse.json({ message }, { status: backendRes.status });
  }

  const { token, userId, name, role, organizationLogo } = parseJson(backendRes.data) ?? {};

  const response = NextResponse.json({ userId, name, role, organizationLogo });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
