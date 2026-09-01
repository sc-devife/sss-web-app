import type { PaymentMilestone } from "@/lib/payment-milestones";

export type { PaymentMilestone };

export interface CreatePaymentMilestonePayload {
  dealUid: string;
  label: string;
  dueDate: string;
  amountInr: number;
}

export interface RecordPaymentPayload {
  uid: string;
  dealUid: string;
  amount: number;
  paymentMethod: string;
  paymentReference: string;
}

export interface DeletePaymentMilestonePayload {
  uid: string;
  dealUid: string;
}
