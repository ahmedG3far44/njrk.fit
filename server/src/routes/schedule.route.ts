import { Router, Request, Response, NextFunction } from 'express';
import { AuthRequest, authMiddleware } from '../middlewares/authMiddleware';
import NutritionPlan from '../models/nutrition.model';
import WeeklyFitnessPlan from '../models/fitness.model';

const router = Router();

interface TimelineItem {
    type: 'meal' | 'snack' | 'workout';
    id: string;
    name: string;
    time: string;
    details: any;
}

const getDayIndexFromStart = (startDate: Date, currentDate: Date) => {
    const diff = Math.floor(
        (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff + 1; // Day 1, Day 2...
};

const parseTimeToMinutes = (time: string): number => {
    const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 9999;

    let [_, h, m, period] = match;
    let hours = parseInt(h);
    const minutes = parseInt(m);

    if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;

    return hours * 60 + minutes;
};


const getWorkoutTime = (type: string) => {
    if (type === 'Cardio') return "07:00 AM";
    if (type === 'Yoga') return "08:00 AM";
    return "06:00 PM";
};


router.get('/', authMiddleware, async (req, res, next) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;

        const dateParam = req.query.date as string;
        const date = dateParam ? new Date(dateParam) : new Date();
        date.setHours(0, 0, 0, 0);

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const targetDayName = dayNames[date.getDay()];

        // ✅ Nutrition Plan (get latest instead of date filter)
        const nutritionPlan = await NutritionPlan.findOne({ userId }).sort({ createdAt: -1 });

        // ✅ Workout Plan (correct overlap query)
        const workoutPlan = await WeeklyFitnessPlan.findOne({
            userId
        });


        const timeline: TimelineItem[] = [];

        // ---------------------------
        // 🥗 MEALS
        // ---------------------------
        if (nutritionPlan) {
            const dayIndex = getDayIndexFromStart(new Date(nutritionPlan.date), date);
            const targetDayLabel = `Day ${dayIndex}`;

            const mealsForDay = nutritionPlan.meals.filter(
                (meal: any) => meal.day === targetDayLabel
            );

            mealsForDay.forEach((meal: any) => {
                timeline.push({
                    type: meal.mealType === 'snack' ? 'snack' : 'meal',
                    id: meal._id?.toString() || Math.random().toString(),
                    name: meal.name,
                    time: meal.time,
                    details: {
                        macros: meal.macros,
                        ingredients: meal.ingredients,
                        instructions: meal.instructions,
                        mealType: meal.mealType,
                        isCompleted: meal.isCompleted ?? false,
                    },
                });
            });
        }

        // ---------------------------
        // 🏋️ WORKOUTS
        // ---------------------------
        if (workoutPlan) {
            const session = workoutPlan.sessions.find(
                (s: any) =>
                    s.dayOfWeek === targetDayName ||
                    (s.date && new Date(s.date).toDateString() === date.toDateString())
            );

            if (session && session.type !== 'Recovery') {
                timeline.push({
                    type: 'workout',
                    id: session._id?.toString() || Math.random().toString(),
                    name: session.name,
                    time: getWorkoutTime(session.type),  // ✅ show actual workout time
                    details: {
                        type: session.type,
                        durationMin: session.durationMin,
                        estimatedCaloriesBurn: session.estimatedCaloriesBurn,
                        exercises: session.exercises,
                        isCompleted: session.isCompleted,
                    },
                });
            }
        }

        // ---------------------------
        // ⏱ SORT PROPERLY
        // ---------------------------
        timeline.sort(
            (a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time)
        );

        res.json({
            date: date.toISOString().split('T')[0],
            timeline,
        });

    } catch (error) {
        next(error);
    }
});

router.patch('/:itemId/complete', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;
        const { itemId } = req.params;
        const { isCompleted } = req.body;

        // Try workout session first
        const workoutPlan = await WeeklyFitnessPlan.findOne({ userId });

        if (workoutPlan) {
            for (const session of workoutPlan.sessions) {
                const sessionId = (session as any)._id?.toString();
                if (sessionId === itemId) {
                    session.isCompleted = isCompleted;
                    await workoutPlan.save();
                    return res.status(200).json({ success: true });
                }
            }
        }

        // Try meal/snack in nutrition plan
        const nutritionPlan = await NutritionPlan.findOne({ userId });

        if (nutritionPlan) {
            const meal = (nutritionPlan.meals as any[]).find(
                (m: any) => m._id?.toString() === itemId
            );
            if (meal) {
                meal.isCompleted = isCompleted;
                await nutritionPlan.save();
                return res.status(200).json({ success: true });
            }
        }

        return res.status(404).json({ error: 'Item not found' });
    } catch (error) {
        next(error);
    }
});

export default router;