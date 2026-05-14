import mongoose from "mongoose";
import User from "../models/user.model";
import ProgressLog from "../models/progress.model";
import FamilyInvitation from "../models/familyInvitation.model";
import NutritionPlan from "../models/nutrition.model";


import {
  authMiddleware,
  type AuthRequest,
} from "../middlewares/authMiddleware";

import { Router, Request, Response, NextFunction } from "express";

const router = Router();

router.get(
  "/",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.userId;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // ✅ تم التصحيح: select صارت دالة برا أقواس البحث
      const familyMembers = await User.find({
        _id: { $in: user.familyMembers || [] },
      }).select("name avatarUrl email");

      console.log("familyMembers"); 
      console.log(familyMembers);

      const nutritionPlans = await NutritionPlan.find({
        userId: { $in: user.familyMembers || [] },
      });

      const nutritionPlansForFamily = familyMembers.map((member) => {
        return {
          id: member._id,
          name: member.name,
          avatarUrl: member.avatarUrl,
          email: member.email,
          calories: nutritionPlans.find(
            (plan) => plan.userId.toString() === member._id.toString(),
          )?.targetMacros.calories || 0,
          protein: nutritionPlans.find(
            (plan) => plan.userId.toString() === member._id.toString(),
          )?.targetMacros.protein || 0,
          carbs: nutritionPlans.find(
            (plan) => plan.userId.toString() === member._id.toString(),
          )?.targetMacros.carbs || 0,
          fats: nutritionPlans.find(
            (plan) => plan.userId.toString() === member._id.toString(),
          )?.targetMacros.fats || 0,
        }
      });

      console.log(nutritionPlansForFamily); 

      const pendingInvitations = await FamilyInvitation.find({
        toUserId: userId,
        status: "pending",
      }).populate("fromUserId", "name avatarUrl");

      res.status(200).json({
        familyMembers: nutritionPlansForFamily,
        pendingInvitations: pendingInvitations.map((inv) => ({
          id: inv._id,
          user: {
            id: (inv.fromUserId as any)._id,
            name: (inv.fromUserId as any).name,
            avatarUrl: (inv.fromUserId as any).avatarUrl,
          },
        })),
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/search",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.userId;
      const query = req.query.q as string;

      if (!query || query.length < 2) {
        return res.status(200).json({ results: [] });
      }

      const currentUser = await User.findById(userId);
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const searchResults = await User.find({
        _id: { $ne: userId },
        $or: [
          { name: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
      })
        .select("name avatarUrl email")
        .limit(10);

      const existingMemberIds = currentUser.familyMembers || [];
      const filteredResults = searchResults.filter(
        (user) =>
          !existingMemberIds.some(
            (id) => id.toString() === user._id.toString(),
          ),
      );

      res.status(200).json({
        results: filteredResults.map((user) => ({
          id: user._id,
          name: user.name,
          avatarUrl: user.avatarUrl,
          username: `${user.name.toLowerCase().replace(/\s/g, "")}#${user._id.toString().slice(-4)}`,
        })),
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/invite",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.userId;
      const { targetUserId } = req.body;

      if (!targetUserId) {
        return res.status(400).json({ error: "targetUserId is required" });
      }

      const inviter = await User.findById(userId);
      if (!inviter) {
        return res.status(404).json({ error: "User not found" });
      }

      // التأكد إن الشخص مو موجود أصلاً في العائلة
      const isAlreadyMember = inviter.familyMembers?.some(
        (id) => id.toString() === targetUserId,
      );
      if (isAlreadyMember) {
        return res
          .status(400)
          .json({ error: "User is already in your family" });
      }

      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ error: "Target user not found" });
      }

      // نبحث عن أي دعوة سابقة بين هالشخصين (مهما كانت حالتها)
      const existingInvitation = await FamilyInvitation.findOne({
        fromUserId: userId,
        toUserId: targetUserId,
      });

      if (existingInvitation) {
        // إذا فيه دعوة معلقة حالياً، نمنعه من التكرار
        if (existingInvitation.status === "pending") {
          return res
            .status(400)
            .json({ error: "Invitation already sent and pending" });
        }

        // إذا كانت الدعوة قديمة (مقبولة/مرفوضة من قبل وتم الحذف)، نجددها!
        existingInvitation.status = "pending";
        await existingInvitation.save();
      } else {
        // إذا مافيه أي تاريخ بينهم، ننشئ دعوة جديدة تماماً
        await FamilyInvitation.create({
          fromUserId: userId,
          toUserId: targetUserId,
          status: "pending",
        });
      }

      res.status(201).json({ success: true, message: "Invitation sent" });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/respond",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.userId;
      const { invitationId, action } = req.body;

      if (!invitationId || !action) {
        return res
          .status(400)
          .json({ error: "invitationId and action are required" });
      }

      if (action !== "accept" && action !== "reject") {
        return res.status(400).json({ error: "Invalid action" });
      }

      const invitation = await FamilyInvitation.findById(invitationId);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      if (invitation.toUserId.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      invitation.status = action === "accept" ? "accepted" : "rejected";
      await invitation.save();

      if (action === "accept") {
        const inviter = await User.findById(invitation.fromUserId);
        if (inviter) {
          inviter.familyMembers = inviter.familyMembers || [];
          inviter.familyMembers.push(new mongoose.Types.ObjectId(userId));
          await inviter.save();
        }

        const responder = await User.findById(userId);
        if (responder) {
          responder.familyMembers = responder.familyMembers || [];
          responder.familyMembers.push(invitation.fromUserId);
          await responder.save();
        }
      }

      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);
router.post(
  "/remove/:memberId",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.userId;
      const memberId = req.params.memberId;

      if (!memberId) {
        return res.status(400).json({ error: "memberId is required" });
      }

      // 1. جلب المستخدم الحالي
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // 2. التأكد إن الشخص المراد حذفه موجود فعلاً في قائمة العائلة
      const memberIndex = currentUser.familyMembers?.findIndex(
        (id) => id.toString() === memberId,
      );

      if (memberIndex === undefined || memberIndex === -1) {
        return res
          .status(400)
          .json({ error: "Member not found in your family list" });
      }

      // 3. حذف الشخص من قائمة المستخدم الحالي
      currentUser.familyMembers?.splice(memberIndex, 1);
      await currentUser.save();

      // 4. حذف المستخدم الحالي من قائمة الشخص الآخر (عشان الحذف يكون من الطرفين)
      const targetUser = await User.findById(memberId);
      if (targetUser && targetUser.familyMembers) {
        const myIndex = targetUser.familyMembers.findIndex(
          (id) => id.toString() === userId,
        );
        if (myIndex !== -1) {
          targetUser.familyMembers.splice(myIndex, 1);
          await targetUser.save();
        }
      }

      res
        .status(200)
        .json({ success: true, message: "Member removed successfully" });
    } catch (error) {
      next(error);
    }
  },
);
router.post(
  "/cancel-invite/:invitationId",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.userId;
      const invitationId = req.params.invitationId;

      if (!invitationId) {
        return res.status(400).json({ error: "invitationId is required" });
      }

      // نبحث عن الدعوة ونتأكد إن اللي جالس يحذفها هو نفس الشخص اللي أرسلها
      const invitation = await FamilyInvitation.findOne({
        _id: invitationId,
        fromUserId: userId,
        status: "pending", // نقدر نلغي الدعوات المعلقة بس
      });

      if (!invitation) {
        return res
          .status(404)
          .json({ error: "Pending invitation not found or not authorized" });
      }

      // نحذف الدعوة من الداتا بيس
      await FamilyInvitation.findByIdAndDelete(invitationId);

      res
        .status(200)
        .json({ success: true, message: "Invitation canceled successfully" });
    } catch (error) {
      next(error);
    }
  },
);
// ---------------------------------------------------------
// 1. لوحة الصدارة العائلية (Family Leaderboard)
// ---------------------------------------------------------
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
      const feed = recentActivities.map((activity) => {
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

router.get(
  "/members",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.userId;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const familyMembers = await User.find({
        _id: { $in: user.familyMembers || [] },
        select: "name avatarUrl email",
      }).lean();
      console.log("Family Members:", familyMembers);

      if (familyMembers.length === 0) {
        return res
          .status(200)
          .json({ familyMembers: "no family members found" });
      }

      res.status(200).json({
        familyMembers: familyMembers.map((user) => ({
          id: user._id,
          name: user.name,
          avatarUrl: user.avatarUrl,
        })),
      });
    } catch (error) {
      next(error);
    }
  },
);



router.get(
  "/plan/member/:memberId",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.userId;
      const memberId = req.params.memberId as string;


      const date = new Date();
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!memberId) {
        return res.status(404).json({ error: "Member not found" });
      }

      if (memberId === userId) {
        return res.status(404).json({ error: "Member not found" });
      }


      const members = user.familyMembers?.map((memberId) => memberId.toString());

      if (!members.includes(memberId)) {
        return res
          .status(200)
          .json({ familyMembers: "This member is not a member of your family" });
      }

      const plan = await NutritionPlan.findOne({ userId: memberId });

      if (!plan) {
        return res.status(404).json({ error: "No plan found for this member" });
      }

      const todayMeals = plan.meals.filter((meal) => Number(meal.day.split(' ')[1]) - 1 === date.getDay());

      res.status(200).json({
        meals: todayMeals,
        targetMacros: plan.targetMacros
      })
    } catch (error) {
      next(error);
    }
  },
);


export default router;
