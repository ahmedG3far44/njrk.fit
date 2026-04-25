import { Meal } from "../types";

export function safeParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON from Gemini");
  }
}


export const normalizeMeal = (meal: any) => ({
  ...meal,
  macros: {
    ...meal.macros,
    fats: meal.macros?.fats ?? meal.macros?.fat,
  },
});
