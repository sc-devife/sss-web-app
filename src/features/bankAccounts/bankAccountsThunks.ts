import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { BankAccount, CreateBankAccountPayload, SetBankAccountStatusPayload } from "@/features/bankAccounts/types";

export const fetchBankAccounts = createAsyncThunk<BankAccount[], number, { rejectValue: string }>(
  "bankAccounts/fetchBankAccounts",
  async (orgId, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<BankAccount[]>(`/bank-accounts/${orgId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load bank accounts"));
    }
  },
);

export const createBankAccount = createAsyncThunk<void, CreateBankAccountPayload, { rejectValue: string }>(
  "bankAccounts/createBankAccount",
  async ({ orgId, payload }, { rejectWithValue }) => {
    try {
      await clientApi.post("/bank-accounts", { orgId, ...payload });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to add account"));
    }
  },
);

export const setBankAccountStatus = createAsyncThunk<void, SetBankAccountStatusPayload, { rejectValue: string }>(
  "bankAccounts/setBankAccountStatus",
  async ({ orgId, accountId, action }, { rejectWithValue }) => {
    try {
      await clientApi.patch("/bank-accounts", { orgId, accountId, action });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to update account status"));
    }
  },
);
