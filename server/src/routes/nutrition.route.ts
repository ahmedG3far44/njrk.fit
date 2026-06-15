import { Router, Request, Response, NextFunction } from "express";
import { validate } from "../middlewares/validateResource";
import {
  generateMealPlanSchema,
  refineMealSchema,
} from "../dtos/nutrition.dto";
import { AuthRequest, authMiddleware } from "../middlewares/authMiddleware";
import User from "../models/user.model";
import NutritionPlan from "../models/nutrition.model";
import { generateMealPlan, refineMeal, regenerateMeal } from "../services/llm.service";
import { awardPoints } from "../services/gamification.service";
import { generatePDF } from "../services/pdf.service";

import { UserContext, Meal } from "../types";


const router = Router();

router.post(
  "/generate",
  authMiddleware,
  validate(generateMealPlanSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      let userId = authReq.user?.userId;

      const targetUserId = req.body.userId;
      if (targetUserId) {
        const currentUser = await User.findById(userId);
        if (
          !currentUser ||
          currentUser.subscription.subscriptionTier === "BASIC"
        ) {
          return res
            .status(403)
            .json({ error: "Premium subscription required for family mode" });
        }
        userId = targetUserId;
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const existingPlan = await NutritionPlan.findOne({ userId: user._id }).sort({ createdAt: -1 });
      if (existingPlan && existingPlan.meals && existingPlan.meals.length > 0) {
        const weekEnd = new Date(existingPlan.date);
        weekEnd.setDate(weekEnd.getDate() + 7);
        if (new Date() < weekEnd) {
          return res.status(403).json({
            error: `This meal plan is still active. You can generate a new plan after ${weekEnd.toLocaleDateString()}.`,
          });
        }
      }

      const repeatMeals = req.body.repeatMeals === true || req.body.repeatMeals === 'true';
      user.preferences.repeatMealsEveryDay = repeatMeals;
      await user.save();

      const userContext: UserContext = {
        name: user.name,
        weight: user.weight,
        height: user.height,
        age: user.age,
        gender: user.gender,
        religion: user.religion,
        weightUnit: user.weightUnit,
        heightUnit: user.heightUnit,
        goal: user.goal,
        targetWeight: user.targetWeight,
        activityLevel: user.activityLevel,
        fitnessGoals: user.fitnessGoals,
        dietaryRestrictions: user.dietaryRestrictions,
        mealsCount: req.body.mealsCount,
        snacksCount: req.body.snacksCount,
        favoriteFoods: req.body.favoriteFoods,
        language: user.language || 'en',
      };

      const plan = await generateMealPlan(
        userContext,
        req.body.mealsCount,
        req.body.snacksCount,
        req.body.favoriteFoods,
        repeatMeals,
        user.language || 'en',
      );

      const startDate = req.body.startDate
        ? new Date(req.body.startDate)
        : new Date();

      let nutritionPlan = await NutritionPlan.findOne({
        userId: user._id,
      });

      if (nutritionPlan) {
        nutritionPlan.meals = plan.meals;
        nutritionPlan.targetMacros = plan.targetMacros;
        nutritionPlan.date = startDate;
      } else {
        nutritionPlan = new NutritionPlan({
          userId: user._id,
          meals: plan.meals,
          targetMacros: plan.targetMacros,
          date: startDate,
        });
      }

      await nutritionPlan.save();


      res.status(201).json({ plan: nutritionPlan });
    } catch (error) {
      console.error("Nutrition generate error:", error);
      next(error);
    }
  },
);


router.post(
  "/refine/:mealId",
  authMiddleware,
  validate(refineMealSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?._id;
      const { mealId } = req.params;
      const { refinement } = req.body;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const nutritionPlan = await NutritionPlan.findOne({
        userId,
      });

      if (!nutritionPlan) {
        return res.status(404).json({ error: "Meal plan not found" });
      }

      const currentMeal = nutritionPlan?.meals.find(
        (m) => m._id?.toString() === mealId,
      ) as Meal | undefined;

      if (!currentMeal) {
        return res.status(404).json({ error: "Meal not found in plan" });
      }

      const userContext: UserContext = {
        name: user.name,
        weight: user.weight,
        height: user.height,
        age: user.age,
        activityLevel: user.activityLevel,
        fitnessGoals: user.fitnessGoals,
        dietaryRestrictions: user.dietaryRestrictions,
        language: user.language || 'en',
      };

      const refinedMeal = await refineMeal(
        currentMeal,
        refinement,
        userContext,
        user.language || 'en',
      );

      const isRepeat = !!user.preferences?.repeatMealsEveryDay;

      if (isRepeat) {
        // Update all duplicate meals in the plan
        nutritionPlan.meals = nutritionPlan.meals.map((m) => {
          const isSameMeal =
            m._id?.toString() === mealId ||
            (m.time === currentMeal.time && m.mealType === currentMeal.mealType) ||
            m.name === currentMeal.name;

          if (isSameMeal) {
            return {
              ...refinedMeal,
              _id: m._id,
              day: m.day,
            } as any;
          }
          return m;
        });
      } else {
        // Update only the refined meal
        nutritionPlan.meals = nutritionPlan.meals.map((m) => {
          if (m._id?.toString() === mealId) {
            return {
              ...refinedMeal,
              _id: m._id,
              day: m.day,
            } as any;
          }
          return m;
        });
      }

      await nutritionPlan.save();

      const refinedMealWithId = {
        ...refinedMeal,
        _id: currentMeal._id,
      };

      res.status(200).json({ meal: refinedMealWithId });
    } catch (error) {
      console.error("Nutrition refine error:", error);
      next(error);
    }
  },
);

router.post(
  "/replace/:mealId",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?._id;
      const { mealId } = req.params;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const nutritionPlan = await NutritionPlan.findOne({
        userId,
      });

      if (!nutritionPlan) {
        return res.status(404).json({ error: "Meal plan not found" });
      }

      const currentMeal = nutritionPlan?.meals.find(
        (m) => m._id?.toString() === mealId,
      ) as Meal | undefined;

      if (!currentMeal) {
        return res.status(404).json({ error: "Meal not found in plan" });
      }

      const userContext: UserContext = {
        name: user.name,
        weight: user.weight,
        height: user.height,
        age: user.age,
        activityLevel: user.activityLevel,
        fitnessGoals: user.fitnessGoals,
        dietaryRestrictions: user.dietaryRestrictions,
        language: user.language || 'en',
      };

      const regeneratedMeal = await regenerateMeal(currentMeal, userContext, user.language || 'en');

      const isRepeat = !!user.preferences?.repeatMealsEveryDay;

      if (isRepeat) {
        // Update all duplicate meals in the plan
        nutritionPlan.meals = nutritionPlan.meals.map((m) => {
          const isSameMeal =
            m._id?.toString() === mealId ||
            (m.time === currentMeal.time && m.mealType === currentMeal.mealType) ||
            m.name === currentMeal.name;

          if (isSameMeal) {
            return {
              ...regeneratedMeal,
              _id: m._id,
              day: m.day,
            } as any;
          }
          return m;
        });
      } else {
        // Update only the replaced meal
        nutritionPlan.meals = nutritionPlan.meals.map((m) => {
          if (m._id?.toString() === mealId) {
            return {
              ...regeneratedMeal,
              _id: m._id,
              day: m.day,
            } as any;
          }
          return m;
        });
      }

      await nutritionPlan.save();

      const regeneratedMealWithId = {
        ...regeneratedMeal,
        _id: currentMeal._id,
      };

      res.status(200).json({ meal: regeneratedMealWithId });
    } catch (error) {
      console.error("Nutrition regenerate error:", error);
      next(error);
    }
  },
);

router.get(
  "/current",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      let userId = authReq.user?._id;

      const targetUserId = req.query.userId as string;
      const filterDate = req.query.date as "today" | "week";

      if (targetUserId) {
        const currentUser = await User.findById(userId);
        if (
          !currentUser ||
          currentUser.subscription.subscriptionTier === "BASIC"
        ) {
          return res
            .status(403)
            .json({ error: "Premium subscription required for family mode" });
        }
        userId = targetUserId;
      }
      const nutritionPlan = await NutritionPlan.findOne({
        userId,
      });

      if (!nutritionPlan) {
        return res
          .status(404)
          .json({ error: "No nutrition plan found" });
      }

      let meals = [];

      if (filterDate === "today") {
        // Calculate day index from plan's start date (not day-of-week)
        const planStart = new Date(nutritionPlan.date);
        planStart.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = Math.floor(
          (today.getTime() - planStart.getTime()) / (1000 * 60 * 60 * 24),
        );
        const dayIndex = diff + 1;
        const currentDayEN = `Day ${dayIndex}`;
        const currentDayAR = `اليوم ${dayIndex}`;

        meals =
          nutritionPlan.meals.filter((meal) => meal.day === currentDayEN || meal.day === currentDayAR) || [];
      } else {
        meals = nutritionPlan.meals || [];
      }

      if (!meals || meals.length === 0) {
        return res.status(404).json({ error: "No meals found for this date" });
      }

      res.status(200).json({ meals, targetMacros: nutritionPlan.targetMacros, planDate: nutritionPlan.date });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/week",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      let userId = authReq.user?._id;

      const targetUserId = req.query.userId as string;
      if (targetUserId) {
        const currentUser = await User.findById(userId);
        if (
          !currentUser ||
          currentUser.subscription.subscriptionTier === "BASIC"
        ) {
          return res
            .status(403)
            .json({ error: "Premium subscription required for family mode" });
        }
        userId = targetUserId;
      }

      const startDateParam = req.query.startDate as string;
      const startDate = startDateParam ? new Date(startDateParam) : new Date();
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const nutritionPlans = await NutritionPlan.find({
        userId,
        date: { $gte: startDate, $lt: endDate },
      }).sort({ date: 1 });

      res.status(200).json({ nutritionPlans });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/log-meal",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?._id;
      const { mealName } = req.body;

      await awardPoints(userId!, 25, `Meal logged: ${mealName}`);

      res.status(200).json({ message: "Meal logged, points awarded" });
    } catch (error) {
      next(error);
    }
  },
);



export default router;
