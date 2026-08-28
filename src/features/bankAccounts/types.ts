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
  isDefault: boolean;
}

export interface CreateBankAccountPayload {
  orgId: string;
  payload: BankAccountPayload;
}

export interface SetBankAccountStatusPayload {
  orgId: string;
  accountId: string;
  action: "deactivate" | "reactivate" | "set-default";
}
