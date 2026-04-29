import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { validate } from '../middlewares/validateResource';
import { updateProfileSchema } from '../dtos/user.dto';
import { requireAuth, AuthRequest } from '../middlewares/requireAuth';
import User from '../models/user.model';
import { uploadFile } from '../configs/aws';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
        }
    }
});

router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as AuthRequest).user?._id;
        const user = await User.findById(userId).select('-passwordHash');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
});

router.patch('/me', requireAuth, validate(updateProfileSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as AuthRequest).user?._id;
        const updates = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-passwordHash');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
});

router.delete('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as AuthRequest).user?._id;

        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }

        await User.findByIdAndDelete(userId);

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        next(error);
    }
});

router.post('/me/avatar', requireAuth, upload.single('avatar'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as AuthRequest).user?._id;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileExt = req.file.originalname.split('.').pop();
        const key = `avatars/${userId}/${uuidv4()}.${fileExt}`;

        const avatarUrl = await uploadFile({
            originalname: req.file.originalname,
            buffer: req.file.buffer,
            mimetype: req.file.mimetype,
            size: req.file.size,
        }, key);

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: { avatarUrl } },
            { new: true }
        ).select('-passwordHash');

        res.status(200).json({ user, avatarUrl });
    } catch (error) {
        next(error);
    }
});

export default router;