import { Macros, UserContext, ActivityLevel, Goal, Gender } from '../types';

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
type UserHealthTargetsInput = {
  currentWeightKg: number;
  targetWeightKg: number;
  heightCm?: number;
  age?: number;
  gender?: Gender;
  activityLevel?: ActivityLevel;
  daysToReachGoal: number;
  goal?: Goal;
};

type UserHealthTargetsResult = {
  estimatedSteps: number;
  estimatedSleepHours: number;
  estimatedWaterOz: number;
};

const CALORIES_PER_KG = 7700;

function estimateCaloriesPerStep(weightKg: number): number {
  /**
   * Heavier users burn more calories per step
   * Average range: 0.04 - 0.07
   */
  return Math.min(
    Math.max(0.04 + (weightKg - 50) * 0.0002, 0.04),
    0.07
  );
}

function estimateSleepHours(age?: number): number {
  if (!age) return 8;

  if (age < 18) return 9;
  if (age < 30) return 8;
  if (age < 50) return 7.5;

  return 7;
}

function estimateWaterOz(
  weightKg: number,
  activityLevel: ActivityLevel = "moderate"
): number {
  /**
   * Base hydration:
   * ~35ml per kg body weight
   */

  let waterMl = weightKg * 35;

  switch (activityLevel) {
    case "sedentary":
      waterMl += 0;
      break;

    case "light":
      waterMl += 250;
      break;

    case "moderate":
      waterMl += 500;
      break;

    case "active":
      waterMl += 750;
      break;

    case "very_active":
      waterMl += 1000;
      break;

    default:
      waterMl += 500;
  }

  // Convert ML -> OZ
  return Math.round(waterMl * 0.033814);
}

export function calculateUserHealthTargets({
  currentWeightKg,
  targetWeightKg,
  age,
  activityLevel = "moderate",
  daysToReachGoal,
  goal,
}: UserHealthTargetsInput): UserHealthTargetsResult {
  const isLosingWeight = goal === "lose_weight" || (!goal && currentWeightKg > targetWeightKg);

  let estimatedSteps: number;

  if (isLosingWeight) {
    const weightToLoseKg = currentWeightKg - targetWeightKg;

    if (weightToLoseKg > 0) {
      const totalCaloriesToBurn = weightToLoseKg * CALORIES_PER_KG;
      const dailyCaloriesToBurn = totalCaloriesToBurn / daysToReachGoal;
      const caloriesPerStep = estimateCaloriesPerStep(currentWeightKg);
      estimatedSteps = Math.ceil(dailyCaloriesToBurn / caloriesPerStep);
    } else {
      estimatedSteps = 5000;
    }
  } else {
    const stepsByActivity: Record<string, number> = {
      sedentary: 3000,
      light: 5000,
      moderate: 7000,
      active: 9000,
      very_active: 11000,
    };
    estimatedSteps = stepsByActivity[activityLevel] || 5000;
  }

  const estimatedSleepHours = estimateSleepHours(age);
  const estimatedWaterOz = estimateWaterOz(currentWeightKg, activityLevel);

  return {
    estimatedSteps,
    estimatedSleepHours,
    estimatedWaterOz,
  };
}