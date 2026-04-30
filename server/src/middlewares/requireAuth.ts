import { Request, Response, NextFunction } from 'express';

import User from '../models/user.model';
import { jwtUtils } from '../utils/jwt';

export interface AuthRequest extends Request {
    user?: {
        _id: string;
        userId: string;
        email: string;
        name: string;
        avatarUrl?: string;
        onboardingCompleted: boolean;
        subscriptionTier: string;
        googleId?: string;
    };
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const payload = jwtUtils.verifyAccessToken(token);

        const user = await User.findById(payload.userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        (req as AuthRequest).user = payload;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accessToken = req.cookies.accessToken;
        const refreshToken = req.cookies.refreshToken;

        // console.log("access token", accessToken);
        // console.log("refresh token", refreshToken);

        // const accessToken = req.headers.authorization?.replace('Bearer ', ''); 

        // const refreshToken = req.headers.refreshToken?.replace('Bearer ', '');

        // Note: Remove console.log of tokens in production to prevent leaking secrets in logs!

        // 1. Try to verify the access token first
        if (accessToken) {
            try {
                const payload = jwtUtils.verifyAccessToken(accessToken);

                // PERFORMANCE FIX: Trust the JWT payload. Do NOT hit the database here.
                (req as AuthRequest).user = payload;
                console.log('access token verified successfully');

                // console.log("user", payload);
                return next();

            } catch (accessError) {
                console.log('access token verification failed', accessError);
                // CRITICAL FIX: Do NOT return a 401 here. 
                // We intentionally swallow this error so the code continues 
                // to the refresh token fallback logic below.
                console.log(accessError);
            }
        }

        // 2. Not valid (or missing) => Verify refresh token
        if (!refreshToken) {
            return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
        }

        try {
            const refreshPayload = jwtUtils.verifyRefreshToken(refreshToken);
            console.log('refresh token verified successfully');
            // SECURITY CHECK: We DO hit the database here to ensure the user 
            // still exists and hasn't been banned before issuing a fresh session.
            const user = await User.findById(refreshPayload?._id);

            if (!user) {
                console.log('user not found');
                res.clearCookie('accessToken');
                res.clearCookie('refreshToken');
                return res.status(401).json({ error: 'User not found' });
            }

            // 3. Create the rich payload for the new access token and req.user
            const userPayload = {
                _id: user._id.toString(),
                userId: user._id.toString(),
                email: user.email,
                name: user.name,
                avatarUrl: user.avatarUrl,
                onboardingCompleted: user.onboardingCompleted,
                subscriptionTier: user.subscriptionTier,
            };

            const newAccessToken = jwtUtils.generateAccessToken(userPayload);

            // Attach the new token to the response cookies
            res.cookie('accessToken', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000 // FIX: 15 minutes (Standard access token life)
            });

            // FIX: Ensure req.user has the full data, not just the refresh payload
            (req as AuthRequest).user = userPayload;
            return next();

        } catch (refreshError) {
            // 4. If refresh token is expired/invalid => clear cookies and redirect
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            return res.status(401).json({
                error: 'Session expired. Please log in again.',
                code: 'SESSION_EXPIRED'
            });
        }

    } catch (error) {
        console.error('Auth Middleware Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};