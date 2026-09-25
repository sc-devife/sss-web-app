import { backendJson } from "@/lib/backend";

export interface PaymentRecord {
  uid: string;
  receivedAmount: number;
  receivedCurrency: string;
  /** "1 base = fxRate <receivedCurrency>" at receipt (1 for a payment in the base currency). */
  fxRate: number;
  /** Credited against the milestone, in base currency. */
  appliedAmountBase: number;
  /** What the money is worth in base at the receipt rate. */
  baseValueReceived: number;
  /** baseValueReceived - appliedAmountBase: positive = FX gain, negative = FX loss. */
  fxDifferenceBase: number;
  paymentMethod: string | null;
  paymentReference: string | null;
  recordedByName: string | null;
  recordedAt: string;
  /** Null while the payment is still awaiting verification. */
  verifiedAt: string | null;
}

export interface PaymentMilestone {
  uid: string;
  dealUid: string;
  label: string;
  dueDate: string;
  amountBase: number;
  amountPaidBase: number;
  status: string;
  markedPaidBy: number | null;
  markedPaidByName: string | null;
  markedPaidAt: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  payments: PaymentRecord[] | null;
  /** Net FX gain/loss across this milestone's payments, in base currency. */
  fxDifferenceBase: number | null;
}

export async function getMilestonesForDeal(dealUid: string): Promise<PaymentMilestone[]> {
  return backendJson<PaymentMilestone[]>(`/api/payment-milestones?dealUid=${dealUid}`);
}
