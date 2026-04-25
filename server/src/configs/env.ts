import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().default('3000'),
    NODE_ENV: z.string().default('development'),
    ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173'),
    CLIENT_URL: z.string().default('http://localhost:5173'),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    OLLAMA_URL: z.string().default('http://localhost:11434/api/generate'),
    OLLAMA_MODEL: z.string().default('qwen2.5-coder:1.5b'),
    OLLAMA_API_KEY: z.string().optional(),
    S3_BUCKET_NAME: z.string().min(1, 'S3_BUCKET_NAME is required'),
    S3_REGION: z.string().default('us-east-1'),
    S3_ACCESS_KEY_ID: z.string().min(1, 'S3_ACCESS_KEY_ID is required'),
    S3_SECRET_ACCESS_KEY: z.string().min(1, 'S3_SECRET_ACCESS_KEY is required'),
    STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
    STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
    NODEMAILER_USER: z.string().email().default('njerka.fit@gmail.com'),
    NODEMAILER_PASSWORD: z.string().default('nodemailer-password'),
    NODEMAILER_HOST: z.string().default('smtp.gmail.com'),
    NODEMAILER_PORT: z.string().default('587'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRATION: z.string().default('1h'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_REFRESH_EXPIRATION: z.string().default('7d'),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_API_KEY: z.string().optional(),
    APPLE_CLIENT_ID: z.string().optional(),
    APPLE_TEAM_ID: z.string().optional(),
    APPLE_KEY_ID: z.string().optional(),
    APPLE_PRIVATE_KEY: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error('Environment validation failed:', parsedEnv.error.format());
    process.exit(1);
}

export const env = {
    ...parsedEnv.data,
    mongodbUri: parsedEnv.data.MONGODB_URI,
    nodeEnv: parsedEnv.data.NODE_ENV,
    allowedOrigins: "*",
    clientUrl: parsedEnv.data.CLIENT_URL,
    ollamaUrl: parsedEnv.data.OLLAMA_URL,
    ollamaModel: parsedEnv.data.OLLAMA_MODEL,
    ollamaApiKey: parsedEnv.data.OLLAMA_API_KEY,
    s3BucketName: parsedEnv.data.S3_BUCKET_NAME,
    googleApiKey: parsedEnv.data.GOOGLE_API_KEY,
    s3Region: parsedEnv.data.S3_REGION,
    s3AccessKeyId: parsedEnv.data.S3_ACCESS_KEY_ID,
    s3SecretAccessKey: parsedEnv.data.S3_SECRET_ACCESS_KEY,
    stripeSecretKey: parsedEnv.data.STRIPE_SECRET_KEY,
    stripeWebhookSecret: parsedEnv.data.STRIPE_WEBHOOK_SECRET,
    nodemailerUser: parsedEnv.data.NODEMAILER_USER,
    nodemailerPassword: parsedEnv.data.NODEMAILER_PASSWORD,
    nodemailerHost: parsedEnv.data.NODEMAILER_HOST,
    nodemailerPort: parsedEnv.data.NODEMAILER_PORT,
    jwtSecret: parsedEnv.data.JWT_SECRET,
    jwtExpiration: parsedEnv.data.JWT_EXPIRATION,
    jwtRefreshSecret: parsedEnv.data.JWT_REFRESH_SECRET,
    jwtRefreshExpiration: parsedEnv.data.JWT_REFRESH_EXPIRATION,
};

export const corsOptions = {
    origin: env.allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};