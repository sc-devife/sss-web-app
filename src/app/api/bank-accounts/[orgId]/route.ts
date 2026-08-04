import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

// No client-facing GET existed here before this migration — BankAccountsPanel
// used to receive its list purely via the server-fetched page prop
// (lib/bank-accounts.ts's getBankAccounts(), which hits the backend directly).
// This route lets the client-dispatched fetchBankAccounts thunk read the same
// backend list endpoint.
export async function GET(_request: Request, { params }: { params: { orgId: string } }) {
  const res = await backendFetch(`/api/bank-accounts/${params.orgId}`);
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
