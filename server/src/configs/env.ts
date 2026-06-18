import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();
console.log("==== EMAIL CHECK ====", process.env.EMAIL_USER);

const envSchema = z.object({
  PORT: z.string().default(process.env.PORT || "8080"),
  NODE_ENV: z.string().default(process.env.NODE_ENV || "development"),

  ALLOWED_ORIGINS: z
    .string()
    .default(process.env.ALLOWED_ORIGINS || "http://localhost:5173"),
  CLIENT_URL: z
    .string()
    .default(process.env.CLIENT_URL || "http://localhost:5173"),
  API_URL: z
    .string()
    .default(process.env.API_URL || "http://localhost:8080/api"),

  MONGODB_URI: z
    .string()
    .default(process.env.MONGODB_URI || "mongodb://localhost:27017/njrk"),

  STRIPE_SECRET_KEY: z.string().default(process.env.STRIPE_SECRET_KEY || ""),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .default(process.env.STRIPE_WEBHOOK_SECRET || ""),
  STRIPE_PRO_PRICE_ID: z.string().default(process.env.STRIPE_PRO_PRICE_ID || ""),
  STRIPE_FAMILY_PRICE_ID: z.string().default(process.env.STRIPE_FAMILY_PRICE_ID || ""),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters")
    .default(process.env.JWT_SECRET || ""),
  JWT_EXPIRATION: z
    .string()
    .default("1h")
    .default(process.env.JWT_EXPIRATION || ""),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters")
    .default(process.env.JWT_REFRESH_SECRET || ""),
  JWT_REFRESH_EXPIRATION: z
    .string()
    .default("7d")
    .default(process.env.JWT_REFRESH_EXPIRATION || ""),

  JWT_ADMIN_SECRET: z
    .string()
    .default("admin-jwt-secret-k3y-must-be-at-least-32-characters-long")
    .default(process.env.JWT_ADMIN_SECRET || ""),
  JWT_ADMIN_EXPIRATION: z
    .string()
    .default("24h")
    .default(process.env.JWT_ADMIN_EXPIRATION || ""),

  ADMIN_EMAIL_1: z
    .string()
    .email()
    .default("admin@njerka.com")
    .default(process.env.ADMIN_EMAIL_1 || ""),
  ADMIN_PASSWORD_1: z
    .string()
    .min(8)
    .default("Admin123!")
    .default(process.env.ADMIN_PASSWORD_1 || ""),
  ADMIN_NAME_1: z
    .string()
    .default("Super Admin")
    .default(process.env.ADMIN_NAME_1 || ""),
  ADMIN_EMAIL_2: z
    .string()
    .email()
    .default("ops@njerka.com")
    .default(process.env.ADMIN_EMAIL_2 || ""),
  ADMIN_PASSWORD_2: z
    .string()
    .min(8)
    .default("Ops123!")
    .default(process.env.ADMIN_PASSWORD_2 || ""),
  ADMIN_NAME_2: z
    .string()
    .default("Operations Admin")
    .default(process.env.ADMIN_NAME_2 || ""),

  GOOGLE_CLIENT_ID: z.string().default(process.env.GOOGLE_CLIENT_ID || ""),
  GOOGLE_CLIENT_SECRET: z
    .string()
    .default(process.env.GOOGLE_CLIENT_SECRET || ""),

  OPENROUTER_API_KEY: z.string().default(process.env.OPENROUTER_API_KEY || ""),
  LLM_MODEL: z.string().default(process.env.LLM_MODEL || "openrouter/free"),

  CLOUDINARY_NAME: z.string().default(process.env.CLOUDINARY_NAME || ""),
  CLOUDINARY_API_KEY: z.string().default(process.env.CLOUDINARY_API_KEY || ""),
  CLOUDINARY_API_SECRET: z
    .string()
    .default(process.env.CLOUDINARY_API_SECRET || ""),

  RAPIDAPI_KEY: z.string().default(process.env.RAPIDAPI_KEY || ""),
  EMAIL_HOST: z.string().default(process.env.EMAIL_HOST || "smtp.hostinger.com"),
  EMAIL_PORT: z.string().default(process.env.EMAIL_PORT || "465"),
  EMAIL_USER: z.string().default(process.env.EMAIL_USER || ""),
  EMAIL_PASSWORD: z.string().default(process.env.EMAIL_PASSWORD || ""),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Environment validation failed:", parsedEnv.error.format());
  process.exit(1);
}

export const env = {
  ...parsedEnv.data,
};

export const corsOptions = {
  origin: env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()),
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
