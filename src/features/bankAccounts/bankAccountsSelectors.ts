import type { RootState } from "@/store/store";

export const selectBankAccounts = (state: RootState) => state.bankAccounts.items;
export const selectBankAccountsStatus = (state: RootState) => state.bankAccounts.status;
export const selectBankAccountsError = (state: RootState) => state.bankAccounts.error;
export const selectBankAccountSaveStatus = (state: RootState) => state.bankAccounts.saveStatus;
export const selectBankAccountSaveError = (state: RootState) => state.bankAccounts.saveError;
export const selectBankAccountStatusUpdateStatus = (state: RootState) => state.bankAccounts.statusUpdateStatus;
export const selectBankAccountStatusUpdateError = (state: RootState) => state.bankAccounts.statusUpdateError;
