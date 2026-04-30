import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email({ message: 'Invalid email format' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
    name: z.string()
        .min(1, { message: 'Name is required' })
        .max(100, { message: 'Name must be less than 100 characters' }),
});

export const loginSchema = z.object({
    email: z.string().email({ message: 'Invalid email format' }),
    password: z.string().min(1, { message: 'Password is required' }),
});

export const refreshTokenSchema = z.object({});

export const forgotPasswordSchema = z.object({
    email: z.string().email({ message: 'Invalid email format' }),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, { message: 'Token is required' }),
    newPassword: z.string().min(8, { message: 'Password must be at least 8 characters' }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;