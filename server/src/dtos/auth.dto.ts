import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const onboardingSchema = z.object({
    age: z.number().min(1, 'Age must be at least 1').max(120, 'Age must be at most 120'),
    gender: z.enum(['male', 'female']),
    height: z.number().min(50, 'Height must be at least 50').max(250, 'Height must be at most 250'),
    weight: z.number().min(40, 'Weight must be at least 40').max(200, 'Weight must be at most 200'),
    dietaryRestrictions: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
    goal: z.string().min(1, 'Goal is required'),
    isFasting: z.boolean().default(false),
    medicalDocuments: z.array(z.string()).optional(),
    fitnessGoals: z.array(z.string()).optional(),
    targetWeight: z.number().optional(),
    weightUnit: z.enum(['kg', 'lb']).optional(),
    heightUnit: z.enum(['cm', 'in']).optional(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;