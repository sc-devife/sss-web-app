import type { PaymentMilestone } from "@/lib/payment-milestones";

export type { PaymentMilestone };

export interface CreatePaymentMilestonePayload {
  dealUid: string;
  label: string;
  dueDate: string;
  amountUsd: number;
}

export interface RecordPaymentPayload {
  uid: string;
  dealUid: string;
  amount: number;
}

export interface DeletePaymentMilestonePayload {
  uid: string;
  dealUid: string;
}
