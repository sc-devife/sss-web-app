import { backendJson } from "@/lib/backend";

export interface BankAccount {
  id: number;
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
}

export async function getBankAccounts(orgId: number): Promise<BankAccount[]> {
  return backendJson<BankAccount[]>(`/api/bank-accounts/${orgId}`);
}
