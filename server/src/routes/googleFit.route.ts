import { Router, Request, Response, NextFunction } from 'express';
import { AuthRequest, authMiddleware } from '../middlewares/authMiddleware';
import { getWeeklySteps } from '../services/googleFit.service';
import { env } from '../configs/env';

const router = Router();

router.get(
  '/weekly-steps',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?._id;
      const currentAccessToken = authReq.user?.googleAccessToken;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = await getWeeklySteps(userId, currentAccessToken || '');

      if (result.refreshedAccessToken) {
        res.cookie('googleAccessToken', result.refreshedAccessToken, {
          httpOnly: true,
          secure: env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000,
        });
      }

      res.json(result);
    } catch (error) {
      console.error('Google Fit route error:', error);
      next(error);
    }
  },
);

export default router;
