import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/requireAuth';
import { 
    checkIn, 
    useFreeze, 
    getInsights, 
    awardPoints,
    getRewards,
    claimReward,
    getActivityHistory,
    applyStreakFreeze,
} from '../services/gamification.service';

const router = Router();

router.post('/check-in', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;
        const timezoneOffset = parseInt(req.body.timezoneOffset as string) || 0;
        
        const result = await checkIn(userId!, timezoneOffset);
        
        await awardPoints(userId!, 10, result.isFirstCheckIn ? 'First check-in' : 'Daily check-in');
        
        res.status(200).json({
            currentStreak: result.currentStreak,
            longestStreak: result.longestStreak,
            availableFreezes: result.availableFreezes,
            isFirstCheckIn: result.isFirstCheckIn,
            isFrozen: result.isFrozen,
            message: result.isFirstCheckIn 
                ? 'First check-in! Your streak has started.' 
                : `Streak: ${result.currentStreak} days`,
        });
    } catch (error) {
        next(error);
    }
});

router.post('/freeze', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;
        const timezoneOffset = parseInt(req.body.timezoneOffset as string) || 0;
        
        const result = await useFreeze(userId!, timezoneOffset);
        
        if (!result.success) {
            return res.status(400).json({ 
                error: 'No freeze tokens available',
                availableFreezes: result.availableFreezes,
            });
        }
        
        res.status(200).json({
            success: true,
            availableFreezes: result.availableFreezes,
            message: 'Streak protected with freeze token.',
        });
    } catch (error) {
        next(error);
    }
});

router.post('/apply-freeze', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;
        
        const result = await applyStreakFreeze(userId!);
        
        if (!result.success) {
            return res.status(400).json({ 
                error: 'No freeze tokens available',
                currentStreak: result.currentStreak,
            });
        }
        
        res.status(200).json({
            success: true,
            currentStreak: result.currentStreak,
            message: 'Streak frozen for today.',
        });
    } catch (error) {
        next(error);
    }
});

router.get('/status', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const User = require('../models/user.model').default;
        
        const user = await User.findById(authReq.user?.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json({
            currentStreak: user.currentStreak,
            longestStreak: user.longestStreak,
            lastCheckInDate: user.lastCheckInDate,
            availableFreezes: user.availableFreezes,
            totalPoints: user.totalPoints || 0,
            pointsToRedeem: user.pointsToRedeem || 0,
        });
    } catch (error) {
        next(error);
    }
});

router.get('/insights', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;
        
        const insights = await getInsights(userId!);
        
        res.status(200).json(insights);
    } catch (error) {
        next(error);
    }
});

router.get('/activity', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;
        const timezoneOffset = parseInt(req.query.timezoneOffset as string) || 0;
        const month = req.query.month ? parseInt(req.query.month as string) : undefined;
        const year = req.query.year ? parseInt(req.query.year as string) : undefined;
        
        const history = await getActivityHistory(userId!, timezoneOffset, month, year);
        
        res.status(200).json(history);
    } catch (error) {
        next(error);
    }
});

router.get('/rewards', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;
        
        const rewards = await getRewards(userId!);
        
        res.status(200).json({ rewards });
    } catch (error) {
        next(error);
    }
});

router.post('/rewards/claim', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;
        const { rewardId } = req.body;
        
        if (!rewardId) {
            return res.status(400).json({ error: 'rewardId is required' });
        }
        
        const idempotencyKey = `${userId}-${rewardId}-${Date.now()}`;
        
        const result = await claimReward(userId!, rewardId, idempotencyKey);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

export default router;