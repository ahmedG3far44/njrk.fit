import { Router, Request, Response, NextFunction } from "express";
import * as adminAnalyticsService from "../services/adminAnalytics.service";
import { adminAuthMiddleware } from "../middlewares/adminAuthMiddleware";

const router = Router();

router.use(adminAuthMiddleware);

router.get(
  "/dashboard",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await adminAnalyticsService.getDashboardStats();
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/revenue",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const days = Math.min(Math.max(parseInt(req.query.days as string) || 30, 1), 365);
      const data = await adminAnalyticsService.getRevenueData(days);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/users/growth",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const days = Math.min(Math.max(parseInt(req.query.days as string) || 30, 1), 365);
      const data = await adminAnalyticsService.getUserGrowthData(days);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/subscriptions/distribution",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await adminAnalyticsService.getSubscriptionDistribution();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/transactions",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const transactions = await adminAnalyticsService.getRecentTransactions(limit);
      res.status(200).json(transactions);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
