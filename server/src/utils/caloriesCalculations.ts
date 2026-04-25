import { Macros, UserContext, ActivityLevel, Goal } from '../types';

export function toKg(weight: number, unit: 'kg' | 'lb' = 'kg'): number {
  return unit === 'lb' ? weight * 0.453592 : weight;
}

export function toCm(height: number, unit: 'cm' | 'in' = 'cm'): number {
  return unit === 'in' ? height * 2.54 : height;
}

export function calculateBMR(ctx: UserContext): number {
  const weight = toKg(ctx.weight || 70, ctx.weightUnit || 'kg');
  const height = toCm(ctx.height || 170, ctx.heightUnit || 'cm');
  const age = ctx.age || 25;
  const gender = ctx.gender || 'male';

  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

export const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calculateTDEE(ctx: UserContext, bmr: number): number {
  const multiplier = activityMultipliers[ctx.activityLevel || 'moderate'];
  return bmr * multiplier;
}

export function adjustCaloriesForGoal(tdee: number, goal: Goal = 'maintain_weight'): number {
  switch (goal) {
    case 'lose_weight':
      return tdee * 0.8;
    case 'gain_weight':
      return tdee * 1.15;
    default:
      return tdee;
  }
}

export function calculateMacros(calories: number, ctx: UserContext): Macros {
  const weight = toKg(ctx.weight || 70, ctx.weightUnit || 'kg');
  const goal = ctx.goal || 'maintain_weight';

  const proteinPerKg = goal === 'gain_weight' ? 2.2 : 1.8;
  const protein = weight * proteinPerKg;

  const fatCaloriesRatio = 0.25;
  const fats = (calories * fatCaloriesRatio) / 9;

  const proteinCalories = protein * 4;
  const fatCalories = fats * 9;
  const remainingCalories = calories - (proteinCalories + fatCalories);
  const carbs = remainingCalories / 4;

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fats: Math.round(fats),
  };
}