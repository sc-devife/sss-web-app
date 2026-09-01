import { backendJson } from "@/lib/backend";

export interface PaymentMilestone {
  uid: string;
  dealUid: string;
  label: string;
  dueDate: string;
  amountInr: number;
  amountPaidInr: number;
  status: string;
  markedPaidBy: number | null;
  markedPaidByName: string | null;
  markedPaidAt: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
}

export async function getMilestonesForDeal(dealUid: string): Promise<PaymentMilestone[]> {
  return backendJson<PaymentMilestone[]>(`/api/payment-milestones?dealUid=${dealUid}`);
}
