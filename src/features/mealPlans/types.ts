import type { MealPlan } from "@/lib/meal-plans";

export type { MealPlan };

export interface MealPlanPayload {
  code: string;
  name: string;
  description: string;
}

export interface UpdateMealPlanPayload {
  uid: string;
  payload: MealPlanPayload & { isActive: boolean };
}
