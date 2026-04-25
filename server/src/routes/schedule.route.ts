import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/requireAuth';
import NutritionPlan from '../models/nutrition.model';
import WeeklyFitnessPlan from '../models/fitness.model';

const router = Router();

interface TimelineItem {
    type: 'meal' | 'workout';
    id: string;
    name: string;
    time: string;
    details: any;
}

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;
        
        const dateParam = req.query.date as string;
        const date = dateParam ? new Date(dateParam) : new Date();
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const nutritionPlan = await NutritionPlan.findOne({
            userId,
            date: { $gte: date, $lt: nextDate },
        });
        
        const startOfWeek = new Date(date);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        
        const workoutPlan = await WeeklyFitnessPlan.findOne({
            userId,
            startDate: { $gte: startOfWeek },
            endDate: { $lte: endOfWeek },
        });
        
        const timeline: TimelineItem[] = [];
        
        if (nutritionPlan) {
            nutritionPlan.meals.forEach((meal) => {
                timeline.push({
                    type: 'meal',
                    id: (meal as any)._id?.toString() || Math.random().toString(),
                    name: meal.name,
                    time: meal.time,
                    details: {
                        macros: meal.macros,
                        ingredients: meal.ingredients,
                        instructions: meal.instructions,
                    },
                });
            });
        }
        
        if (workoutPlan) {
            const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const targetDay = dayOfWeek[date.getDay()];
            
            workoutPlan.sessions.forEach((session) => {
                if (session.dayOfWeek === targetDay || 
                    (session.date && new Date(session.date).toDateString() === date.toDateString())) {
                    timeline.push({
                        type: 'workout',
                        id: (session as any)._id?.toString() || Math.random().toString(),
                        name: session.name,
                        time: `${session.durationMin} min`,
                        details: {
                            type: session.type,
                            durationMin: session.durationMin,
                            estimatedCaloriesBurn: session.estimatedCaloriesBurn,
                            exercises: session.exercises,
                            isCompleted: session.isCompleted,
                        },
                    });
                }
            });
        }
        
        timeline.sort((a, b) => {
            const timeA = a.time.replace(':', '');
            const timeB = b.time.replace(':', '');
            return parseInt(timeA) - parseInt(timeB);
        });
        
        res.status(200).json({ 
            date: date.toISOString().split('T')[0],
            timeline,
        });
    } catch (error) {
        next(error);
    }
});

router.patch('/:itemId/complete', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;
        const { itemId } = req.params;
        const { isCompleted } = req.body;
        
        const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
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
        
        return res.status(404).json({ error: 'Item not found' });
    } catch (error) {
        next(error);
    }
});

export default router;