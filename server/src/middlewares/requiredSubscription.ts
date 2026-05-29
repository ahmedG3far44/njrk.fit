import { NextFunction, Request, Response } from "express";
import { env } from "../configs/env";

import User from "../models/user.model";
import jwt from "jsonwebtoken";

interface DecodedToken {
    _id: string,
    userId: string,
    email: string,
    name: string,
    avatarUrl: string,
    onboardingCompleted: boolean,
    subscriptionTier: 'FAMILY' | 'PRO' | 'BASIC',
    googleAccessToken: string | null,
}

export const requiredFamilySubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accessToken = req.cookies.accessToken;

        if (!accessToken) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const decodedToken = jwt.verify(accessToken, env.JWT_SECRET) as DecodedToken;

        if (!decodedToken.email) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await User.findOne({ email: decodedToken.email });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        const subscriptionTier = user.subscription?.subscriptionTier;

        if (!subscriptionTier || subscriptionTier !== 'FAMILY') {
            return res.status(403).json({ error: 'Subscription required' });
        }

        next();

    } catch (error) {
        console.error('Error checking subscription:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
export const requiredProSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accessToken = req.cookies.accessToken;

        if (!accessToken) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const decodedToken = jwt.verify(accessToken, env.JWT_SECRET) as DecodedToken;

        if (!decodedToken.email) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await User.findOne({ email: decodedToken.email });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        const subscriptionTier = user.subscription?.subscriptionTier;

        if (!subscriptionTier || subscriptionTier !== 'PRO') {
            return res.status(403).json({ error: 'Subscription required' });
        }

        next();

    } catch (error) {
        console.error('Error checking subscription:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}