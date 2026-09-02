import { backendJson } from "@/lib/backend";

// Mirrors IncomingTransactionResponseDTO — one recorded customer payment,
// enriched with who it came from and which trip it belongs to.
export interface IncomingTransaction {
  milestoneUid: string;
  dealUid: string;
  escapeUid: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  label: string;
  amountInr: number;
  amountPaidInr: number;
  status: string;
  paymentMethod: string | null;
  paymentReference: string | null;
  markedPaidAt: string | null;
  markedPaidByName: string | null;
}

export async function getIncomingTransactions(): Promise<IncomingTransaction[]> {
  return backendJson<IncomingTransaction[]>(`/api/transactions/incoming`);
}
