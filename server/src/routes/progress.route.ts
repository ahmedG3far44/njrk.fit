import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { AuthRequest, authMiddleware } from '../middlewares/authMiddleware';
import ProgressLog from '../models/progress.model';
import User from '../models/user.model';
import { uploadFile } from '../configs/aws';
import { awardPoints } from '../services/gamification.service';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/log', authMiddleware, upload.single('scanFile'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;
        const { weightKg, bodyFatPercentage, muscleMass, dailySteps, tags, notes, source } = req.body;

        let scanFileUrl: string | undefined;

        if (req.file) {
            const key = `scans/${userId}/${uuidv4()}.${req.file.originalname.split('.').pop()}`;
            scanFileUrl = await uploadFile({
                originalname: req.file.originalname,
                buffer: req.file.buffer,
                mimetype: req.file.mimetype,
                size: req.file.size,
            }, key);
        }

        const progressLog = await ProgressLog.create({
            userId,
            date: new Date(),
            weightKg: weightKg ? parseFloat(weightKg) : undefined,
            bodyFatPercentage: bodyFatPercentage ? parseFloat(bodyFatPercentage) : undefined,
            muscleMass: muscleMass ? parseFloat(muscleMass) : undefined,
            dailySteps: dailySteps ? parseInt(dailySteps) : undefined,
            tags: tags ? JSON.parse(tags) : [],
            notes,
            scanFileUrl,
            source: scanFileUrl ? 'inbody_scan' : (source as 'manual' | 'inbody_scan') || 'manual',
        });

        if (weightKg) {
            await User.findByIdAndUpdate(userId, { weight: parseFloat(weightKg) });
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

router.post('/extract-inbody', authMiddleware, upload.single('scanFile'), async (req: Request, res: Response, next: NextFunction) => {
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