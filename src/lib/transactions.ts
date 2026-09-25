import { backendJson } from "@/lib/backend";
import type { PaymentRecord } from "@/lib/payment-milestones";

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
  amountBase: number;
  amountPaidBase: number;
  status: string;
  paymentMethod: string | null;
  paymentReference: string | null;
  markedPaidAt: string | null;
  markedPaidByName: string | null;
  /** Every payment received against this milestone, in the currency it arrived in. */
  payments: PaymentRecord[] | null;
  /** Net FX gain/loss across those payments, in base currency. */
  fxDifferenceBase: number | null;
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
  paidAmount?: number | null;
  paidCurrency?: string | null;
  fxRate?: number | null;
}

export async function getOutgoingTransactions(): Promise<OutgoingTransaction[]> {
  return backendJson<OutgoingTransaction[]>(`/api/transactions/outgoing`);
}
