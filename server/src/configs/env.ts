import { z } from "zod";

import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.string().default("development"),

  CLIENT_URL: z
    .string()
    .default(process.env.CLIENT_URL || "http://localhost:5173"),
  API_URL: z
    .string()
    .default(process.env.API_URL || "http://localhost:8080/api"),

  MONGODB_URI: z
    .string()
    .default(process.env.MONGODB_URI || "mongodb://localhost:27017/njerka"),

  GOOGLE_CLIENT_ID: z.string().default(process.env.GOOGLE_CLIENT_ID || ""),
  GOOGLE_CLIENT_SECRET: z
    .string()
    .default(process.env.GOOGLE_CLIENT_SECRET || ""),

  STRIPE_SECRET_KEY: z.string().default(process.env.STRIPE_SECRET_KEY || ""),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .default(process.env.STRIPE_WEBHOOK_SECRET || ""),
  STRIPE_PRO_PRICE_ID: z
    .string()
    .default(process.env.STRIPE_PRO_PRICE_ID || ""),
  STRIPE_FAMILY_PRICE_ID: z
    .string()
    .default(process.env.STRIPE_FAMILY_PRICE_ID || ""),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRATION: z.string().default("1h"),

  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_REFRESH_EXPIRATION: z.string().default("7d"),

  JWT_ADMIN_SECRET: z
    .string()
    .min(32, "JWT_ADMIN_SECRET must be at least 32 characters"),
  JWT_ADMIN_EXPIRATION: z.string().default("24h"),

  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),

  CLOUDINARY_NAME: z.string().default(process.env.CLOUDINARY_NAME || ""),
  CLOUDINARY_API_KEY: z.string().default(process.env.CLOUDINARY_API_KEY || ""),
  CLOUDINARY_API_SECRET: z
    .string()
    .default(process.env.CLOUDINARY_API_SECRET || ""),

  RAPIDAPI_KEY: z.string().default(process.env.RAPIDAPI_KEY || ""),
  EMAIL_FROM: z.string().default(process.env.EMAIL_FROM || ""),
  RESEND_API_KEY: z.string().default(process.env.RESEND_API_KEY || ""),

  OPEN_ROUTER_API_KEY: z
    .string()
    .default(process.env.OPEN_ROUTER_API_KEY || ""),
  OPEN_ROUTER_MODEL: z
    .string()
    .default(process.env.OPEN_ROUTER_MODEL || "openrouter/free"),
});

const parsedEnv = envSchema.safeParse(process.env);

console.log(
  parsedEnv.success
    ? "Environment variables validated successfully."
    : "Environment validation failed:",
  parsedEnv.success ? "" : parsedEnv.error.format(),
);

if (!parsedEnv.success) {
  console.error("Environment validation failed:", parsedEnv.error.format());
  process.exit(1);
}

export const env = {
  ...parsedEnv.data,
};

// console.log("Loaded environment variables:", env);

export const corsOptions = {
  origin: env.CLIENT_URL,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
