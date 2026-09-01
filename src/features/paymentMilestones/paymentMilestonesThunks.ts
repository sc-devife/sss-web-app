import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type {
  PaymentMilestone,
  CreatePaymentMilestonePayload,
  RecordPaymentPayload,
  DeletePaymentMilestonePayload,
} from "@/features/paymentMilestones/types";

export const fetchMilestonesForDeal = createAsyncThunk<PaymentMilestone[], string, { rejectValue: string }>(
  "paymentMilestones/fetchMilestonesForDeal",
  async (dealUid, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<PaymentMilestone[]>(`/payment-milestones?dealUid=${dealUid}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load payment milestones"));
    }
  },
);

export const createPaymentMilestone = createAsyncThunk<void, CreatePaymentMilestonePayload, { rejectValue: string }>(
  "paymentMilestones/createPaymentMilestone",
  async (payload, { rejectWithValue }) => {
    try {
      await clientApi.post("/payment-milestones", payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to add milestone"));
    }
  },
);

export const recordPayment = createAsyncThunk<void, RecordPaymentPayload, { rejectValue: string }>(
  "paymentMilestones/recordPayment",
  async ({ uid, amount, paymentMethod, paymentReference }, { rejectWithValue }) => {
    try {
      await clientApi.post(`/payment-milestones/${uid}/record-payment`, { amount, paymentMethod, paymentReference });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to record payment"));
    }
  },
);

export const verifyPaymentMilestone = createAsyncThunk<void, string, { rejectValue: string }>(
  "paymentMilestones/verifyPaymentMilestone",
  async (uid, { rejectWithValue }) => {
    try {
      await clientApi.post(`/payment-milestones/${uid}/verify`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to verify payment"));
    }
  },
);

export const deletePaymentMilestone = createAsyncThunk<void, DeletePaymentMilestonePayload, { rejectValue: string }>(
  "paymentMilestones/deletePaymentMilestone",
  async ({ uid }, { rejectWithValue }) => {
    try {
      await clientApi.delete(`/payment-milestones/${uid}`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to delete milestone"));
    }
  },
);
