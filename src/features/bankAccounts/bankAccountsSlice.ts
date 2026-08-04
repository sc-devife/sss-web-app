import { createSlice } from "@reduxjs/toolkit";
import type { BankAccount } from "@/features/bankAccounts/types";
import { fetchBankAccounts, createBankAccount, setBankAccountStatus } from "@/features/bankAccounts/bankAccountsThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface BankAccountsState {
  items: BankAccount[];
  status: RequestStatus;
  error: string | null;

  saveStatus: RequestStatus;
  saveError: string | null;

  statusUpdateStatus: RequestStatus;
  statusUpdateError: string | null;
}

const initialState: BankAccountsState = {
  items: [],
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
  statusUpdateStatus: "idle",
  statusUpdateError: null,
};

const bankAccountsSlice = createSlice({
  name: "bankAccounts",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBankAccounts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchBankAccounts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchBankAccounts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load bank accounts";
      })

      .addCase(createBankAccount.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(createBankAccount.fulfilled, (state) => {
        state.saveStatus = "succeeded";
      })
      .addCase(createBankAccount.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to add account";
      })

      .addCase(setBankAccountStatus.pending, (state) => {
        state.statusUpdateStatus = "loading";
        state.statusUpdateError = null;
      })
      .addCase(setBankAccountStatus.fulfilled, (state) => {
        state.statusUpdateStatus = "succeeded";
      })
      .addCase(setBankAccountStatus.rejected, (state, action) => {
        state.statusUpdateStatus = "failed";
        state.statusUpdateError = action.payload ?? "Failed to update account status";
      });
  },
});

export const { resetSaveStatus } = bankAccountsSlice.actions;
export default bankAccountsSlice.reducer;
