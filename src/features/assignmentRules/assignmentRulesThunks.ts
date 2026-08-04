import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type {
  PriorityCalendarEntry,
  PriorityCalendarEntryPayload,
  ToggleAutoAssignPayload,
} from "@/features/assignmentRules/types";

export const fetchPriorityCalendarEntries = createAsyncThunk<PriorityCalendarEntry[], void, { rejectValue: string }>(
  "assignmentRules/fetchPriorityCalendarEntries",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<PriorityCalendarEntry[]>("/priority-calendar");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load priority calendar"));
    }
  },
);

export const createPriorityCalendarEntry = createAsyncThunk<void, PriorityCalendarEntryPayload, { rejectValue: string }>(
  "assignmentRules/createPriorityCalendarEntry",
  async (payload, { rejectWithValue }) => {
    try {
      await clientApi.post("/priority-calendar", payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to add season"));
    }
  },
);

export const deletePriorityCalendarEntry = createAsyncThunk<void, string, { rejectValue: string }>(
  "assignmentRules/deletePriorityCalendarEntry",
  async (uid, { rejectWithValue }) => {
    try {
      await clientApi.delete(`/priority-calendar/${uid}`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to remove season"));
    }
  },
);

// Mutates the Organization entity (auto_assign_enabled), not this module's
// own data — same "different entity as a side effect" shape as the quote/
// invoice template "set default" thunks. Organization isn't Redux-managed
// yet, so the panel calls router.refresh() afterward to pick up the new
// value from its still-server-fetched organization prop.
export const toggleAutoAssign = createAsyncThunk<void, ToggleAutoAssignPayload, { rejectValue: string }>(
  "assignmentRules/toggleAutoAssign",
  async ({ organizationUid, enabled }, { rejectWithValue }) => {
    try {
      await clientApi.put("/organizations", { uid: organizationUid, auto_assign_enabled: enabled });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to update setting"));
    }
  },
);
