
import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../middlewares/validateResource';
import { updateProfileSchema } from '../dtos/user.dto';
import { AuthRequest, authMiddleware } from '../middlewares/authMiddleware';
import { upload } from '../configs/multer';
import { uploadToCloudinary } from '../services/upload.service';

import User from '../models/user.model';


const router = Router();

router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
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

router.patch('/me', authMiddleware, validate(updateProfileSchema), async (req: Request, res: Response, next: NextFunction) => {
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

router.delete('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
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

router.post('/me/avatar', authMiddleware, upload.single('avatar'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const avatar = req.file
        const userId = (req as AuthRequest).user?._id;

        const userExists = await User.findById(userId);

        if (!avatar) return res.status(400).json({ error: 'No file uploaded' });

        if (!userExists) return res.status(404).json({ error: 'User not found' });

        const key = `/njerka/profiles/avatar`;

        const { secure_url } = await uploadToCloudinary(avatar.buffer, key);

        if (!secure_url) return res.status(500).json({ error: 'Failed to upload image' });

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: { avatarUrl: secure_url } },
            { new: true }
        ).select('-passwordHash');

        res.status(200).json({ user, avatarUrl: secure_url });
    } catch (error) {
        next(error);
    }
});

export default router;