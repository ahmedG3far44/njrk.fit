import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/auth.service';

import User from '../models/user.model';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const payload = verifyAccessToken(token);
        
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