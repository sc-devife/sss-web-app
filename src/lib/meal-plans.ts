import { backendJson } from "@/lib/backend";

export interface MealPlan {
  uid: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export async function getMealPlans(): Promise<MealPlan[]> {
  return backendJson<MealPlan[]>("/api/v1/meal-plans");
}
