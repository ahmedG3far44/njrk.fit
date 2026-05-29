import mongoose from 'mongoose';
import User from '../models/user.model';
import ProgressLog from '../models/progress.model';

import { Router, Request, Response, NextFunction } from 'express';
import { AuthRequest, authMiddleware } from '../middlewares/authMiddleware';
import { awardPoints } from '../services/gamification.service';
import { upload } from '../configs/multer';
import { uploadToCloudinary } from '../services/upload.service';

const router = Router();

router.get('/can-update', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;
        const now = new Date();

        const user = await User.findById(userId).select('lastStatsUpdate');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // New users (no previous weight log) can log immediately!
        if (!user.lastStatsUpdate) {
            return res.status(200).json({
                canUpdate: true,
                message: 'Welcome! You can log your initial stats now.',
                daysUntilUpdate: 0,
            });
        }

        const lastUpdate = new Date(user.lastStatsUpdate);
        const daysDiff = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff >= 7) {
            return res.status(200).json({ canUpdate: true, daysUntilUpdate: 0 });
        }

        const nextAllowedDate = new Date(lastUpdate);
        nextAllowedDate.setDate(lastUpdate.getDate() + 7);

        return res.status(200).json({
            canUpdate: false,
            message: `You can update on ${nextAllowedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`,
            daysUntilUpdate: 7 - daysDiff,
            nextUpdateDate: nextAllowedDate
        });
    } catch (error) {
        next(error);
    }
});

router.post('/log', authMiddleware, upload.single('scanFile'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;
        const { weightKg, bodyFatPercentage, muscleMass, dailySteps, tags, notes, source } = req.body;

        const user = await User.findById(userId).select('lastStatsUpdate');

        if (user?.lastStatsUpdate) {
            const lastUpdate = new Date(user.lastStatsUpdate);
            const now = new Date();
            const daysDiff = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysDiff < 7) {
                const nextAllowedDate = new Date(lastUpdate);
                nextAllowedDate.setDate(lastUpdate.getDate() + 7);
                return res.status(403).json({ 
                    error: 'You can only update your stats once per week',
                    nextAllowedDate: nextAllowedDate
                });
            }
        }

        let scanFileUrl: string | undefined;
        if (req.file) {
            try {
                const uploadResult = await uploadToCloudinary(req.file.buffer, 'inbody_scans');
                scanFileUrl = uploadResult.secure_url;
            } catch (uploadError) {
                console.error('Failed to upload scan file to Cloudinary:', uploadError);
            }
        }

        // Handle tags properly if stringified JSON array
        let parsedTags: string[] = [];
        if (tags) {
            try {
                parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
            } catch (err) {
                if (typeof tags === 'string') {
                    parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
                }
            }
        }

        const parsedWeight = (weightKg && weightKg !== 'undefined' && weightKg !== 'null') ? parseFloat(weightKg) : undefined;

        const progressLog = await ProgressLog.create({
            userId,
            date: new Date(),
            weightKg: parsedWeight,
            bodyFatPercentage: (bodyFatPercentage && bodyFatPercentage !== 'undefined' && bodyFatPercentage !== 'null') ? parseFloat(bodyFatPercentage) : undefined,
            muscleMass: (muscleMass && muscleMass !== 'undefined' && muscleMass !== 'null') ? parseFloat(muscleMass) : undefined,
            dailySteps: (dailySteps && dailySteps !== 'undefined' && dailySteps !== 'null') ? parseInt(dailySteps) : undefined,
            tags: parsedTags,
            notes: notes === 'undefined' ? '' : notes,
            scanFileUrl,
            source: scanFileUrl ? 'inbody_scan' : (source as 'manual' | 'inbody_scan') || 'manual',
        });

        if (parsedWeight) {
            await User.findByIdAndUpdate(userId, {
                weight: parsedWeight,
                lastStatsUpdate: new Date()
            });
        } else {
            await User.findByIdAndUpdate(userId, { lastStatsUpdate: new Date() });
        }

        await awardPoints(userId!, 15, 'Progress log recorded');

        res.status(201).json({ progressLog });
    } catch (error) {
        next(error);
    }
});

router.get('/dashboard', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;
        const timeframe = req.query.timeframe as string || '7days';

        let startDate = new Date();
        switch (timeframe) {
            case '7weeks':
                startDate.setDate(startDate.getDate() - 49);
                break;
            case '30days':
                startDate.setDate(startDate.getDate() - 30);
                break;
            default:
                startDate.setDate(startDate.getDate() - 7);
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);

        const pipeline = [
            { $match: { userId: userIdObj, date: { $gte: startDate } } },
            { $sort: { date: -1 } as any },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$date' }
                    },
                    weightKg: { $avg: '$weightKg' },
                    logs: { $push: '$$ROOT' },
                }
            },
            { $sort: { _id: 1 } as any },
        ];

        const weightTrend = await ProgressLog.aggregate(pipeline);

        const latestLog = await ProgressLog.findOne({ userId })
            .sort({ date: -1 });

        const totalLogs = await ProgressLog.countDocuments({ userId: userIdObj, date: { $gte: startDate } });

        res.status(200).json({
            timeframe,
            weightTrend,
            latestWeight: latestLog?.weightKg,
            totalLogs,
        });
    } catch (error) {
        next(error);
    }
});

router.get('/history', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const logs = await ProgressLog.find({ userId })
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        const total = await ProgressLog.countDocuments({ userId });

        res.status(200).json({
            logs,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        next(error);
    }
});

router.post('/extract-inbody', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const mockExtracted = {
            weightKg: 75.5,
            bodyFatPercentage: 18.2,
            muscleMass: 35.8,
        };

        res.status(200).json({ extracted: mockExtracted });
    } catch (error) {
        console.error('InBody extraction error:', error);
        res.status(500).json({ error: 'Failed to extract data from scan' });
    }
});

router.get('/feelings', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;
        const days = parseInt(req.query.days as string) || 7;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const logs = await ProgressLog.find({
            userId,
            date: { $gte: startDate },
            $or: [
                { tags: { $exists: true, $ne: [] } },
                { notes: { $exists: true, $ne: '' } },
            ],
        }).sort({ date: -1 }).select('date tags notes');

        const feelings = logs.map(log => ({
            date: log.date,
            tags: log.tags || [],
            notes: log.notes || '',
        }));

        res.status(200).json({ feelings });
    } catch (error) {
        next(error);
    }
});

export default router;