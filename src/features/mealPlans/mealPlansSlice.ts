import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import type { MealPlan } from "@/features/mealPlans/types";
import { fetchMealPlans, createMealPlan, updateMealPlan, deleteMealPlan } from "@/features/mealPlans/mealPlansThunks";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface MealPlansState {
  items: MealPlan[];
  status: RequestStatus;
  error: string | null;

  saveStatus: RequestStatus;
  saveError: string | null;

  deleteStatus: RequestStatus;
  deleteError: string | null;
}

const initialState: MealPlansState = {
  items: [],
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
  deleteStatus: "idle",
  deleteError: null,
};

const mealPlansSlice = createSlice({
  name: "mealPlans",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMealPlans.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMealPlans.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchMealPlans.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load meal plans";
      })

      .addCase(deleteMealPlan.pending, (state) => {
        state.deleteStatus = "loading";
        state.deleteError = null;
      })
      .addCase(deleteMealPlan.fulfilled, (state) => {
        state.deleteStatus = "succeeded";
      })
      .addCase(deleteMealPlan.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload ?? "Failed to delete meal plan";
      })

      .addMatcher(isAnyOf(createMealPlan.pending, updateMealPlan.pending), (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addMatcher(isAnyOf(createMealPlan.fulfilled, updateMealPlan.fulfilled), (state) => {
        state.saveStatus = "succeeded";
      })
      .addMatcher(isAnyOf(createMealPlan.rejected, updateMealPlan.rejected), (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Failed to save meal plan";
      });
  },
});

export const { resetSaveStatus } = mealPlansSlice.actions;
export default mealPlansSlice.reducer;
