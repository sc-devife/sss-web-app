import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { ReminderRule, ReminderRulePayload } from "@/features/reminderRules/types";

export const fetchReminderRules = createAsyncThunk<ReminderRule[], void, { rejectValue: string }>(
  "reminderRules/fetchReminderRules",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<ReminderRule[]>("/reminder-rules");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load reminder rules"));
    }
  },
);

export const createReminderRule = createAsyncThunk<void, ReminderRulePayload, { rejectValue: string }>(
  "reminderRules/createReminderRule",
  async (payload, { rejectWithValue }) => {
    try {
      await clientApi.post("/reminder-rules", payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to add reminder rule"));
    }
  },
);

export const deleteReminderRule = createAsyncThunk<void, string, { rejectValue: string }>(
  "reminderRules/deleteReminderRule",
  async (uid, { rejectWithValue }) => {
    try {
      await clientApi.delete(`/reminder-rules/${uid}`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to delete reminder rule"));
    }
  },
);
