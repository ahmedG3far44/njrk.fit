import { Router, Request, Response, NextFunction } from "express";
import {
  authMiddleware,
  type AuthRequest,
} from "../middlewares/authMiddleware";
import User from "../models/user.model";
import mongoose from "mongoose";

const router = Router();
const ProgressLog =
  mongoose.models.ProgressLog ||
  mongoose.model("ProgressLog", new mongoose.Schema({}, { strict: false }));

router.get(
  "/",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.userId;
      const limit = parseInt(req.query.limit as string) || 50;

      const users = await User.find({})
        .select("name avatarUrl totalPoints currentStreak")
        .sort({ totalPoints: -1 })
        .limit(limit);

      const currentUserRank = await User.countDocuments({
        totalPoints: { $gt: (await User.findById(userId))?.totalPoints || 0 },
      });

      const currentUser = await User.findById(userId).select(
        "name avatarUrl totalPoints currentStreak",
      );

      const totalUsers = await User.countDocuments();
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

      res.status(200).json({
        leaderboard,
        currentUser: {
          rank: currentUserRank + 1,
          id: currentUser?._id,
          name: currentUser?.name,
          avatarUrl: currentUser?.avatarUrl,
          points: currentUser?.totalPoints || 0,
          streak: currentUser?.currentStreak || 0,
          goalAdherence: Math.min(
            100,
            Math.round((currentUser?.totalPoints || 0) / 500),
          ),
        },
        percentile,
        totalUsers,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/leaderboard",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.userId;

      const currentUser = await User.findById(userId);
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // نجمع الـ ID حق اليوزر الحالي مع IDs أفراد عائلته
      const familyIds = [userId, ...(currentUser.familyMembers || [])].filter(
        Boolean,
      ) as (string | mongoose.Types.ObjectId)[];

      // نجيب بياناتهم من الداتا بيس ونرتبهم تنازلياً حسب النقاط
      const leaderboard = await User.find({ _id: { $in: familyIds } })
        .select("name avatarUrl points level") // جلبنا الاسم والصورة والنقاط (عدل اسم حقل النقاط حسب اللي عندك)
        .sort({ points: -1 }) // -1 يعني ترتيب تنازلي (من الأعلى للأقل)
        .limit(10); // أعلى 10 أشخاص

      // إضافة ترتيب (Rank) لكل شخص عشان الواجهة
      const rankedLeaderboard = leaderboard.map((user, index) => ({
        rank: index + 1,
        id: user._id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        points: (user as any).points || 0,
        level: (user as any).level || 1,
      }));

      res.status(200).json({ leaderboard: rankedLeaderboard });
    } catch (error) {
      next(error);
    }
  },
);
// ---------------------------------------------------------
// 2. شريط نشاطات العائلة (Family Activity Feed)
// ---------------------------------------------------------
router.get(
  "/feed",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.userId;

      const currentUser = await User.findById(userId);
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // نفس الفكرة: نبي نشاطات اليوزر وعائلته بس
      const familyIds = [userId, ...(currentUser.familyMembers || [])].filter(
        Boolean,
      ) as (string | mongoose.Types.ObjectId)[];

      // نجيب آخر 20 سجل إنجاز من العائلة كلها
      const recentActivities = await ProgressLog.find({
        userId: { $in: familyIds },
      })
        .sort({ date: -1 }) // الأحدث أولاً
        .limit(20)
        .populate("userId", "name avatarUrl"); // نجيب اسم وصورة صاحب النشاط

      // نرتب البيانات بشكل نظيف وجاهز للواجهة (Front-end)
      const feed = recentActivities.map((activity: any) => {
        const user = activity.userId as any;

        // نحدد وش نوع الإنجاز اللي سواه عشان نكتب رسالة حلوة
        let actionText = "سجل إنجاز جديد 🎯";
        if (activity.weightKg) {
          actionText = `حدّث وزنه إلى ${activity.weightKg} kg ⚖️`;
        } else if (activity.dailySteps && activity.dailySteps > 10000) {
          actionText = `حطم الرقم القياسي ومشى ${activity.dailySteps} خطوة! 🏃‍♂️🔥`;
        } else if (activity.tags && activity.tags.length > 0) {
          actionText = `يشعر بأنه: ${activity.tags.join(", ")} 💭`;
        }

        return {
          id: activity._id,
          user: {
            id: user._id,
            name: user.name,
            avatarUrl: user.avatarUrl,
          },
          action: actionText,
          date: activity.date,
          likesCount: 0, // تقدر تضيف مودل لايكات بعدين لو حبيت تطورها
        };
      });

      res.status(200).json({ feed });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
