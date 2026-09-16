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

// Mirrors OutgoingTransactionResponseDTO — one payout the agency made to a
// vendor (a Hotel or an Activity — see lib/hotels.ts's HotelPayment and
// lib/activities.ts's ActivityPayment), enriched with who it went to and
// which trip it belongs to.
export interface OutgoingTransaction {
  paymentUid: string;
  vendorType: "Hotel" | "Activity";
  vendorUid: string;
  vendorName: string;
  escapeUid: string;
  tripCode: string | null;
  transactionId: string | null;
  paymentMethod: string;
  amount: number;
  paidBy: string | null;
  paymentDate: string;
  notes: string | null;
  status: string;
  createdAt: string;
}

export async function getOutgoingTransactions(): Promise<OutgoingTransaction[]> {
  return backendJson<OutgoingTransaction[]>(`/api/transactions/outgoing`);
}
