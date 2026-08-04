import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

// No client-facing GET existed here before this migration — UsersList used to
// receive its list purely via the server-fetched page prop (lib/users.ts's
// getOrgUsers()). This route lets the client-dispatched fetchUsers thunk read
// the same backend list endpoint.
export async function GET() {
  const res = await backendFetch("/users/all");
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
