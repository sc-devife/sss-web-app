import type { BankAccount } from "@/lib/bank-accounts";

export type { BankAccount };

export interface BankAccountPayload {
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankShortName: string;
  branchName: string;
  ifsc: string;
  swiftCode: string;
  micrCode: string;
  country: string;
  branchState: string;
  branchCity: string;
  branchAddress: string;
  currency: string;
}

export interface CreateBankAccountPayload {
  orgId: number;
  payload: BankAccountPayload;
}

export interface SetBankAccountStatusPayload {
  orgId: number;
  accountId: number;
  action: "deactivate" | "reactivate";
}
