import type { RootState } from "@/store/store";

export const selectMealPlans = (state: RootState) => state.mealPlans.items;
export const selectMealPlansStatus = (state: RootState) => state.mealPlans.status;
export const selectMealPlansError = (state: RootState) => state.mealPlans.error;
