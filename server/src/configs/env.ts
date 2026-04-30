import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().default('8080'),
    NODE_ENV: z.string().default('development'),

    ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
    CLIENT_URL: z.string().default('http://localhost:5173'),
    API_URL: z.string().default('http://localhost:8080/api'),

    MONGODB_URI: z.string().default("mongodb://localhost:27017/njrk"),

    
    S3_BUCKET_NAME: z.string().min(1, 'S3_BUCKET_NAME is required'),
    S3_REGION: z.string().default('us-east-1'),
    S3_ACCESS_KEY_ID: z.string().min(1, 'S3_ACCESS_KEY_ID is required'),
    S3_SECRET_ACCESS_KEY: z.string().min(1, 'S3_SECRET_ACCESS_KEY is required'),

    STRIPE_SECRET_KEY: z.string().default('sk_test_51TJWvyRPSIjKJwi6NZEWveg1OOYEL3Z0aAJrGjeV8boI9yPPFEka3C0rvg3AfGJLCtda7zQSnN5JhKbIjx02W94t00GKZWRVb4'),
    STRIPE_WEBHOOK_SECRET: z.string().default('whsec_13d5831238f76ff2f8c8cd2f7cab809c04fef9ec0616e93b79ff9c1486cb50f4'),

    EMAIL_USER: z.string().email().default('njerka.fit@gmail.com'),
    EMAIL_PASSWORD: z.string().default('njrk fit@2026'),
    EMAIL_HOST: z.string().default('smtp.gmail.com'),
    EMAIL_PORT: z.string().default('587'),

    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRATION: z.string().default('1h'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_REFRESH_EXPIRATION: z.string().default('7d'),
    
    GOOGLE_CLIENT_ID: z.string().default('691688385657-i821cud5r17h2dfv7kmnk161701jcr6h.apps.googleusercontent.com'),
    GOOGLE_CLIENT_SECRET: z.string().default('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'),

    OLLAMA_URL: z.string().default('http://localhost:11434/api/generate'),
    OLLAMA_MODEL: z.string().default('qwen2.5-coder:1.5b'),
    OLLAMA_API_KEY: z.string().default('89dd178811ad48ee91a49437af6099d2.pp68HePfs7bMRJWPUEfBnaEL'),

    OPENROUTER_API_KEY: z.string().default('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'),

    GOOGLE_API_KEY: z.string().default('AIzaSyC3bY3mYGc6bwa0yJxjAtnQ-SIsTah85PA')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error('Environment validation failed:', parsedEnv.error.format());
    process.exit(1);
}

export const env = {
    ...parsedEnv.data
};

export const corsOptions = {
    origin: env.ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};