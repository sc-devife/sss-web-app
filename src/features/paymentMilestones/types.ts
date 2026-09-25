import type { PaymentMilestone } from "@/lib/payment-milestones";

export type { PaymentMilestone };

export interface CreatePaymentMilestonePayload {
  dealUid: string;
  label: string;
  dueDate: string;
  amountBase: number;
}

export interface RecordPaymentPayload {
  uid: string;
  dealUid: string;
  amount: number;
  paymentMethod: string;
  paymentReference: string;
  /** The currency the money arrived in; omitted = the vendor's base currency. */
  currencyCode?: string;
  /** "1 base = exchangeRate <currencyCode>"; omitted = today's rate. */
  exchangeRate?: number;
}

export interface DeletePaymentMilestonePayload {
  uid: string;
  dealUid: string;
}
