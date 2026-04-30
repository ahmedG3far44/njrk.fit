import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/requireAuth';
import NutritionPlan from '../models/nutrition.model';
import WeeklyFitnessPlan from '../models/fitness.model';
import { generatePDF } from '../services/pdf.service';

const router = Router();

interface TimelineItem {
  type: 'meal' | 'workout';
  id: string;
  name: string;
  time: string;
  details: any;
}

const buildTimelineForDate = async (
  userId: string | undefined,
  date: Date
): Promise<TimelineItem[]> => {
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
    nutritionPlan.meals.forEach((meal: any) => {
      timeline.push({
        type: 'meal',
        id: meal._id?.toString() || Math.random().toString(),
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

    workoutPlan.sessions.forEach((session: any) => {
      if (
        session.dayOfWeek === targetDay ||
        (session.date && new Date(session.date).toDateString() === date.toDateString())
      ) {
        timeline.push({
          type: 'workout',
          id: session._id?.toString() || Math.random().toString(),
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

  return timeline;
};

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    const dateParam = req.query.date as string;
    const date = dateParam ? new Date(dateParam) : new Date();
    date.setHours(0, 0, 0, 0);

    const timeline = await buildTimelineForDate(userId, date);

    res.status(200).json({
      date: date.toISOString().split('T')[0],
      timeline,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/export/pdf', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    const dateParam = req.query.date as string;
    const view = (req.query.view as 'day' | 'week') || 'day';
    const date = dateParam ? new Date(dateParam) : new Date();
    date.setHours(0, 0, 0, 0);

    if (view === 'day') {
      const timeline = await buildTimelineForDate(userId, date);
      const pdfBuffer = await generatePDF('schedule', {
        title: 'Daily Schedule',
        generatedAt: new Date(),
        dateLabel: date.toISOString().split('T')[0],
        timeline: timeline.map(item => ({
          type: item.type,
          name: item.name,
          time: item.time,
          details: item.details
        })),
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="schedule-${date.toISOString().split('T')[0]}.pdf"`
      );
      return res.status(200).send(pdfBuffer);
    } else {
      // Weekly view
      const startOfWeek = new Date(date);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      
      const weeklyTimeline: any[] = [];
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(startOfWeek);
        currentDay.setDate(startOfWeek.getDate() + i);
        const dayTimeline = await buildTimelineForDate(userId, currentDay);
        
        dayTimeline.forEach(item => {
          weeklyTimeline.push({
            type: item.type,
            name: `${dayNames[i]} - ${item.name}`,
            time: item.time,
            details: item.details
          });
        });
      }

      const pdfBuffer = await generatePDF('schedule', {
        title: 'Weekly Schedule',
        generatedAt: new Date(),
        dateLabel: `Week of ${startOfWeek.toISOString().split('T')[0]}`,
        timeline: weeklyTimeline,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="schedule-week-${startOfWeek.toISOString().split('T')[0]}.pdf"`
      );
      return res.status(200).send(pdfBuffer);
    }
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
