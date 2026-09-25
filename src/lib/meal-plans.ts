import { backendJson } from "@/lib/backend";

export interface MealPlan {
  uid: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  // true = custom plan owned by one hotel (not in the library).
  custom?: boolean;
}

export async function getMealPlans(): Promise<MealPlan[]> {
  return backendJson<MealPlan[]>("/api/v1/meal-plans");
}
