import { NextFunction, Request, Response, Router } from "express";
import { AuthRequest, authMiddleware } from "../middlewares/authMiddleware";
import { generatePDF } from "../services/pdf.service";

import WeeklyFitnessPlan from "../models/fitness.model";
import NutritionPlan from "../models/nutrition.model";
import GroceryList from "../models/groceryList.model";
import User from "../models/user.model";



const router = Router();

const getLatestDocument = async (model: any, userId: string) => {
    return model.findOne({ userId }).sort({ createdAt: -1 });
};

const sendPDF = (res: Response, buffer: Buffer, filename: string) => {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(buffer);
};


const pdfController = {

    exportFitnessPlanPDF: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as AuthRequest).user?.userId;
            if (!userId) return res.status(401).json({ message: "Unauthorized" });

            const [user, fitnessPlan] = await Promise.all([
                User.findById(userId),
                getLatestDocument(WeeklyFitnessPlan, userId)
            ]);

            if (!user) return res.status(404).json({ message: "User not found" });
            if (!fitnessPlan) return res.status(404).json({ message: "Fitness plan is empty, please create a workout plan " });

            const pdfBuffer = await generatePDF('workout', fitnessPlan, user);

            sendPDF(res, pdfBuffer, "workout.pdf");

        } catch (error) {
            next(error);
        }
    },

    exportNutritionPlanPDF: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as AuthRequest).user?.userId;
            if (!userId) return res.status(401).json({ message: "Unauthorized" });

            const [user, nutritionPlan] = await Promise.all([
                User.findById(userId),
                getLatestDocument(NutritionPlan, userId)
            ]);

            if (!user) return res.status(404).json({ message: "User not found" });
            if (!nutritionPlan) return res.status(404).json({ message: "Nutrition plan is empty, please create a meal plan " });

            const pdfBuffer = await generatePDF('meal', nutritionPlan, user);

            sendPDF(res, pdfBuffer, "meal.pdf");

        } catch (error) {
            next(error);
        }
    },

    exportGroceryListPDF: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as AuthRequest).user?.userId;
            if (!userId) return res.status(401).json({ message: "Unauthorized" });

            const [user, groceryList] = await Promise.all([
                User.findById(userId),
                GroceryList.findOne({ userId })
            ]);

            if (!user) return res.status(404).json({ message: "User not found" });
            if (!groceryList) return res.status(404).json({ message: "Grocery list not found" });

            if (!groceryList || groceryList?.items?.length === 0) {
                return res.status(400).json({ message: "can't export PDF, grocery list is empty, make sure you have a nutrition plan set up and regenerate the grocery list " });
            }

            const pdfBuffer = await generatePDF('grocery', groceryList, user);

            sendPDF(res, pdfBuffer, "groceries.pdf");

        } catch (error) {
            next(error);
        }
    }

};


router.get('/nutrition/pdf', authMiddleware, pdfController.exportNutritionPlanPDF);
router.get('/fitness/pdf', authMiddleware, pdfController.exportFitnessPlanPDF);
router.get('/groceries/pdf', authMiddleware, pdfController.exportGroceryListPDF);


export default router;
