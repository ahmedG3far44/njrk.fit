import { Router, Request, Response, NextFunction } from "express";
import {
  authMiddleware,
  type AuthRequest,
} from "../middlewares/authMiddleware";
import User from "../models/user.model";

const router = Router();

router.get(
  "/",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.userId;
      const limit = parseInt(req.query.limit as string) || 50;
      const scope = (req.query.scope as string) || "global";

      const currentUser = await User.findById(userId).select(
        "name avatarUrl totalPoints currentStreak familyMembers",
      );
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }

      let userFilter: Record<string, unknown> = {};

      if (scope === "family") {
        const familyIds = [
          userId,
          ...(currentUser.familyMembers || []),
        ].filter(Boolean);
        userFilter = { _id: { $in: familyIds } };
      }

      const users = await User.find(userFilter)
        .select("name avatarUrl totalPoints currentStreak")
        .sort({ totalPoints: -1 })
        .limit(limit);

      const currentUserRank = await User.countDocuments({
        ...userFilter,
        totalPoints: { $gt: currentUser.totalPoints || 0 },
      });

      const totalUsers =
        scope === "global"
          ? await User.countDocuments()
          : await User.countDocuments(userFilter);

      const percentile =
        totalUsers > 0
          ? Math.round(((totalUsers - currentUserRank) / totalUsers) * 100)
          : 0;

      const leaderboard = users.map((user, index) => ({
        rank: index + 1,
        id: user._id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        points: user.totalPoints || 0,
        streak: user.currentStreak || 0,
        goalAdherence: Math.min(100, Math.round((user.totalPoints || 0) / 500)),
      }));

      const currentEntry = leaderboard.find(
        (e) => e.id.toString() === userId,
      );

      res.status(200).json({
        leaderboard,
        currentUser: {
          rank: currentEntry?.rank || currentUserRank + 1,
          id: currentUser._id,
          name: currentUser.name,
          avatarUrl: currentUser.avatarUrl,
          points: currentUser.totalPoints || 0,
          streak: currentUser.currentStreak || 0,
          goalAdherence: 0,
        },
        percentile,
        totalUsers,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
