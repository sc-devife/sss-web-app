import { backendJson } from "@/lib/backend";

export interface BankAccount {
  uid: string;
  bankName: string;
  bankShortName: string;
  branchName: string;
  ifsc: string;
  swiftCode: string | null;
  micrCode: string | null;
  country: string;
  branchState: string;
  branchCity: string;
  branchAddress: string | null;
  accountNumber: string;
  accountName: string;
  currency: string;
  status: "active" | "inactive";
}

export async function getBankAccounts(orgId: string): Promise<BankAccount[]> {
  return backendJson<BankAccount[]>(`/api/bank-accounts/${orgId}`);
}
