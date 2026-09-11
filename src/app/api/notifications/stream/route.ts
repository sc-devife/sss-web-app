import { getSessionToken } from "@/lib/session";

// Streaming proxy, not a normal route.ts — everything below exists to keep
// this a true pass-through pipe rather than a buffered JSON responder.
// `force-dynamic` + `nodejs` runtime are required so Next never tries to
// cache or statically evaluate this route; `revalidate = 0` reinforces the
// same thing for older Next versions that check it separately.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/sss";

// The browser's EventSource can't set an Authorization header, so it can't
// call the Spring Boot SSE endpoint directly — this route is the bridge:
// same-origin to the browser (the httpOnly session cookie rides along
// automatically, same as every other page load), then this server-side
// handler reads that cookie and attaches the real Bearer token when it
// opens the upstream connection to the backend. The backend's response body
// (a live ReadableStream of SSE frames) is hooked directly to this route's
// own Response body — no buffering, no re-encoding, no JSON parsing — so
// bytes flow to the browser as the backend writes them.
export async function GET() {
  const token = getSessionToken();
  if (!token) {
    return new Response(null, { status: 401 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${API_BASE_URL}/notifications/stream`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
      cache: "no-store",
    });
  } catch {
    // Backend unreachable/restarting — surface a plain failed response;
    // EventSource's own retry logic (see notificationStream.ts) is what
    // brings the connection back, no special handling needed here.
    return new Response(null, { status: 502 });
  }

  if (!backendRes.ok || !backendRes.body) {
    return new Response(null, { status: backendRes.status || 502 });
  }

  return new Response(backendRes.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Disables response buffering on nginx-style proxies sitting in
      // front of this route in some deployments; harmless everywhere else.
      "X-Accel-Buffering": "no",
    },
  });
}
