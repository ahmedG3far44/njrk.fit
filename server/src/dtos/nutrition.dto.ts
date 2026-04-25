import { z } from 'zod';

export const generateMealPlanSchema = z.object({
    calories: z.number().positive().optional(),
    startDate: z.string().optional(),
});

export const refineMealSchema = z.object({
    refinement: z.string().min(1, 'Refinement prompt is required'),
    dayIndex: z.number().int().min(0).max(6).optional(),
});

export const generateWorkoutPlanSchema = z.object({
    duration: z.number().int().min(15).max(120).default(60),
    equipment: z.array(z.string()).default([]),
    startDate: z.string().optional(),
});

export const completeSessionSchema = z.object({
    exerciseIndices: z.array(z.number()).optional(),
});

export type GenerateMealPlanInput = z.infer<typeof generateMealPlanSchema>;
export type RefineMealInput = z.infer<typeof refineMealSchema>;
export type GenerateWorkoutPlanInput = z.infer<typeof generateWorkoutPlanSchema>;
export type CompleteSessionInput = z.infer<typeof completeSessionSchema>;