import jwt from "jsonwebtoken";
import { env } from "../configs/env";



interface TokenPayload {
    _id: string;
    userId: string; 
    email: string;
    name: string;
    avatarUrl?: string;
    onboardingCompleted: boolean;
    subscriptionTier: string;
    googleId?: string;
}

export const jwtUtils = {
    generateAccessToken: (payload: TokenPayload) => {
        return jwt.sign(payload, env.jwtSecret, {
            expiresIn: '24h'
        });
    },
    generateRefreshToken: (payload: TokenPayload) => {
        return jwt.sign(payload, env.jwtRefreshSecret, {
            expiresIn: '30d',
        });
    },
    verifyAccessToken: (token: string) => {
        return jwt.verify(token, env.jwtSecret) as TokenPayload;
    },
    verifyRefreshToken: (token: string) => {
        return jwt.verify(token, env.jwtRefreshSecret) as TokenPayload;
    },
} 