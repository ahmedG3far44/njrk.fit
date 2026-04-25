import { z } from 'zod';

export const updateProfileSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    height: z.number().positive().max(300).optional(),
    weight: z.number().positive().max(500).optional(),
    age: z.number().int().positive().min(13).max(120).optional(),
    activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
    fitnessGoals: z.array(z.string()).optional(),
    dietaryRestrictions: z.array(z.string()).optional(),
    equipment: z.array(z.string()).optional(),
    preferences: z.object({
        notifications: z.boolean().optional(),
        weeklySummary: z.boolean().optional(),
        mealReminders: z.boolean().optional(),
    }).optional(),
});

export const updateAvatarSchema = z.object({});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateAvatarInput = z.infer<typeof updateAvatarSchema>;