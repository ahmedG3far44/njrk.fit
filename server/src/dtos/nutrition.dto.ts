import { z } from 'zod';

export const generateMealPlanSchema = z.object({
    mealsCount: z.number().int().min(1).max(5).default(3),
    snacksCount: z.number().int().min(0).max(3).default(0),
    favoriteFoods: z.array(z.string()).default([]),
    startDate: z.string().optional(),
    repeatMeals: z.boolean().optional(),
});

export const refineMealSchema = z.object({
    refinement: z.string().min(1, 'Refinement prompt is required'),
    dayIndex: z.number().int().min(0).max(6).optional(),
});

export const generateWorkoutPlanSchema = z.object({
    duration: z.number().int().min(15).max(120).default(60),
    trainingDays: z.number().int().min(1).max(7).default(3),
    trainingProgram: z.enum(['push_pull_legs', 'upper_lower', 'anterior_posterior', 'arnold_split', 'full_body']).default('full_body'),
    startDate: z.string().optional(),
});

export const completeSessionSchema = z.object({
    exerciseIndices: z.array(z.number()).optional(),
});

export type GenerateMealPlanInput = z.infer<typeof generateMealPlanSchema>;
export type RefineMealInput = z.infer<typeof refineMealSchema>;
export type GenerateWorkoutPlanInput = z.infer<typeof generateWorkoutPlanSchema>;
export type CompleteSessionInput = z.infer<typeof completeSessionSchema>;