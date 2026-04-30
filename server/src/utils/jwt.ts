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
        return jwt.sign(payload, env.JWT_SECRET, {
            expiresIn: '24h'
        });
    },
    generateRefreshToken: (payload: TokenPayload) => {
        return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
            expiresIn: '30d',
        });
    },
    verifyAccessToken: (token: string) => {
        return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    },
    verifyRefreshToken: (token: string) => {
        return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
    },
} 