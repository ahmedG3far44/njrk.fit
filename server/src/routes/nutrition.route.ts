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
      };

      const plan = await generateMealPlan(userContext);

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
      };

      const refinedMeal = await refineMeal(
        currentMeal,
        refinement,
        userContext,
      );

      const refinedMealWithId = {
        ...refinedMeal,
        _id: currentMeal._id,
      };

      const updatedNutritionPlan = await NutritionPlan.findOneAndUpdate(
        {
          userId: userId,
          "meals._id": mealId as string,
        },
        {
          $set: { "meals.$": refinedMealWithId },
        },
        {
          new: true,
          runValidators: true,
        },
      );

      console.log(
        "updated Nutrition Plan in refined meal",
        updatedNutritionPlan,
      );

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
      };

      const regeneratedMeal = await regenerateMeal(currentMeal, userContext);

      const regeneratedMealWithId = {
        ...regeneratedMeal,
        _id: currentMeal._id,
      };

      const updatedNutritionPlan = await NutritionPlan.findOneAndUpdate(
        {
          userId: userId,
          "meals._id": mealId as string,
        },
        {
          $set: { "meals.$": regeneratedMealWithId },
        },
        {
          new: true,
          runValidators: true,
        },
      );

      console.log(
        "updated Nutrition Plan in refined meal",
        updatedNutritionPlan,
      );

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
      const date = new Date();
      let currentDay = "Day 1";
      switch (date.getDay()) {
        case 0:
          currentDay = "Day 1";
          break;
        case 1:
          currentDay = "Day 2";
          break;
        case 2:
          currentDay = "Day 3";
          break;
        case 3:
          currentDay = "Day 4";
          break;
        case 4:
          currentDay = "Day 5";
          break;
        case 5:
          currentDay = "Day 6";
          break;
        case 6:
          currentDay = "Day 7";
          break;
      }

      const nutritionPlan = await NutritionPlan.findOne({
        userId,
      });

      let meals = [];

      if (filterDate === "today") {
        meals =
          nutritionPlan?.meals?.filter((meal) => meal.day === currentDay) || [];
      } else {
        meals = nutritionPlan?.meals || [];
      }

      if (!nutritionPlan) {
        return res
          .status(404)
          .json({ error: "No nutrition plan found for this date" });
      }

      if (!meals || meals.length === 0) {
        return res.status(404).json({ error: "No meals found for this date" });
      }

      res.status(200).json({ meals, targetMacros: nutritionPlan.targetMacros });
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
