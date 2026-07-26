import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/sss";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // matches the backend's 12h JWT expiry

// Proxies login to the Spring Boot backend and sets the JWT as an httpOnly
// cookie, so the token never touches client-side JS/localStorage.
export async function POST(request: Request) {
  const { email, password } = await request.json();

  const backendRes = await fetch(`${API_BASE_URL}/api/login/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!backendRes.ok) {
    const body = await backendRes.json().catch(() => null);
    const message = typeof body === "string" ? body : (body?.message ?? "Invalid credentials");
    return NextResponse.json({ message }, { status: backendRes.status });
  }

  const { token, userId, name } = await backendRes.json();

  const response = NextResponse.json({ userId, name });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
