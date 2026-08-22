import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { MealPlan, MealPlanPayload, UpdateMealPlanPayload } from "@/features/mealPlans/types";

export const fetchMealPlans = createAsyncThunk<MealPlan[], void, { rejectValue: string }>(
  "mealPlans/fetchMealPlans",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<MealPlan[]>("/library/meal-plans");
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load meal plans"));
    }
  },
);

export const createMealPlan = createAsyncThunk<void, MealPlanPayload, { rejectValue: string }>(
  "mealPlans/createMealPlan",
  async (payload, { rejectWithValue }) => {
    try {
      await clientApi.post("/library/meal-plans", payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save meal plan"));
    }
  },
);

export const updateMealPlan = createAsyncThunk<void, UpdateMealPlanPayload, { rejectValue: string }>(
  "mealPlans/updateMealPlan",
  async ({ uid, payload }, { rejectWithValue }) => {
    try {
      await clientApi.put(`/library/meal-plans/${uid}`, payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to save meal plan"));
    }
  },
);

export const deleteMealPlan = createAsyncThunk<void, string, { rejectValue: string }>(
  "mealPlans/deleteMealPlan",
  async (uid, { rejectWithValue }) => {
    try {
      await clientApi.delete(`/library/meal-plans/${uid}`);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to delete meal plan"));
    }
  },
);
