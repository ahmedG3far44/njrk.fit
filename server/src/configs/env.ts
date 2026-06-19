import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.string().default("development"),

  ALLOWED_ORIGINS: z.string().default("http://localhost:5173"),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  API_URL: z.string().default("http://localhost:8080/api"),

  MONGODB_URI: z.string().default("mongodb://localhost:27017/njrk"),

  STRIPE_SECRET_KEY: z.string().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().default(""),
  STRIPE_PRO_PRICE_ID: z.string().default(""),
  STRIPE_FAMILY_PRICE_ID: z.string().default(""),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRATION: z.string().default("1h"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_REFRESH_EXPIRATION: z.string().default("7d"),

  JWT_ADMIN_SECRET: z.string().min(32, "JWT_ADMIN_SECRET must be at least 32 characters"),
  JWT_ADMIN_EXPIRATION: z.string().default("24h"),

  ADMIN_EMAIL_1: z.string().email().optional(),
  ADMIN_PASSWORD_1: z.string().min(8).optional(),
  ADMIN_NAME_1: z.string().optional(),
  ADMIN_EMAIL_2: z.string().email().optional(),
  ADMIN_PASSWORD_2: z.string().min(8).optional(),
  ADMIN_NAME_2: z.string().optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  GEMINI_API_KEY: z.string().default(""),
  GEMINI_MODEL_EN: z.string().default("gemini-3.5-flash"),
  GEMINI_MODEL_AR: z.string().default("gemini-3.5-flash"),

  CLOUDINARY_NAME: z.string().default(""),
  CLOUDINARY_API_KEY: z.string().default(""),
  CLOUDINARY_API_SECRET: z.string().default(""),

  RAPIDAPI_KEY: z.string().default(""),
  EMAIL_HOST: z.string().default("smtp.hostinger.com"),
  EMAIL_PORT: z.coerce.number().default(465),
  EMAIL_USER: z.string().default(""),
  EMAIL_PASSWORD: z.string().default(""),
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
