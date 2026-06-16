import { z } from 'zod';

export const loginAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['admin', 'super_admin']).default('admin'),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  tier: z.enum(['BASIC', 'PRO', 'FAMILY']).optional(),
  status: z.enum(['active', 'blocked', 'all']).default('all'),
  sort: z.enum(['createdAt', 'name', 'email', 'subscription.subscriptionTier']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const blockUserSchema = z.object({
  reason: z.string().min(1, 'Block reason is required').max(500),
});

export const updateUserSchema = z.object({
  language: z.enum(['en', 'ar']).optional(),
});

export type LoginAdminInput = z.infer<typeof loginAdminSchema>;
export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
export type BlockUserInput = z.infer<typeof blockUserSchema>;
