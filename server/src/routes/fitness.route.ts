import User from '../models/user.model';
import WeeklyFitnessPlan from '../models/fitness.model';

import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../middlewares/validateResource';
import { generateWorkoutPlanSchema, completeSessionSchema } from '../dtos/nutrition.dto';
import { requireAuth, AuthRequest } from '../middlewares/requireAuth';
import { generateWorkoutPlan } from '../services/llm.service';
import { awardPoints } from '../services/gamification.service';
import { generatePDF } from '../services/pdf.service';
import { UserContext } from '../types';

const router = Router();


export const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]; 

router.post('/generate', requireAuth, validate(generateWorkoutPlanSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const { duration, equipment } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userContext: UserContext = {
      name: user.name,
      weight: user.weight,
      height: user.height,
      age: user.age,
      gender: user.gender,
      activityLevel: user.activityLevel,
      fitnessGoals: user.fitnessGoals || [],
      dietaryRestrictions: user.dietaryRestrictions || [],
    };

    const plan = await generateWorkoutPlan(
      userContext,
      equipment || user.equipment || [],
      duration || 60
    );

    const startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const workoutPlan = await WeeklyFitnessPlan.create({
      userId,
      startDate,
      endDate,
      sessionsCompleted: 0,
      sessions: plan.sessions,
    });

    res.status(201).json({ workoutPlan });
  } catch (error) {
    console.error('Fitness generate error:', error);
    next(error);
  }
});
router.patch(
  "/session/:sessionId/complete",
  requireAuth,
  validate(completeSessionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthRequest).user?.userId;
      const { sessionId } = req.params;
      const { exerciseIndices } = req.body;

      const workoutPlan = await WeeklyFitnessPlan.findOne({
        userId,
        "sessions._id": sessionId,
      });

      if (!workoutPlan) {
        return res.status(404).json({ error: "Session not found" });
      }

      const session = workoutPlan.sessions.find(
        (s) => s._id?.toString() === sessionId
      );

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
      });

      if (session.dayOfWeek !== today) {
        return res.status(403).json({
          error: `You can only complete ${today} sessions today`,
        });
      }

      if (exerciseIndices?.length > 0) {
        session.exercises.forEach((ex, idx) => {
          if (exerciseIndices.includes(idx)) {
            (ex as any).isCompleted = true;
          }
        });
      } else {
        session.exercises.forEach((ex) => {
          (ex as any).isCompleted = true;
        });
      }

      session.isCompleted = true;
      session.completedAt = new Date();
      workoutPlan.sessionsCompleted += 1;

      await workoutPlan.save();

      await awardPoints(userId!, 50, "Workout session completed");

      res.status(200).json({
        workoutPlan,
        sessionCompleted: session,
      });
    } catch (error) {
      console.error("Fitness complete session error:", error);
      next(error);
    }
  }
);

router.get('/current', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    const dateParam = req.query.date as 'day' | 'week';

    if(!dateParam){
      return res.status(400).json({ error: 'Invalid date parameter' });
    }

    const date = new Date();
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    

    const currentDay = weekDays[date.getDay()];

    const workoutPlan = await WeeklyFitnessPlan.findOne({
      userId,
    });

    let workouts: any;

    if (dateParam === "week") {
      workouts = workoutPlan?.sessions;
    } else {
      workouts = workoutPlan?.sessions.filter((s: any) => s.dayOfWeek === currentDay);
    }

    res.status(200).json({ data: workouts });
  } catch (error) {
    next(error);
  }
});

router.get('/export/pdf', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const viewParam = (req.query.view as 'day' | 'week') || 'week';

    const date = new Date();
    const currentDay = weekDays[date.getDay()];

    const workoutPlan = await WeeklyFitnessPlan.findOne({ userId }).sort({ createdAt: -1 });

    if (!workoutPlan) {
      return res.status(404).json({ error: 'Workout plan not found' });
    }

    const selectedSessions = viewParam === 'day'
      ? workoutPlan.sessions.filter((session: any) => session.dayOfWeek === currentDay)
      : workoutPlan.sessions;

    const pdfBuffer = await generatePDF('workout', {
      title: viewParam === 'day' ? `Workout Plan - ${currentDay}` : 'Workout Plan',
      generatedAt: new Date(),
      sessions: selectedSessions.map((session: any) => ({
        dayLabel: session.dayOfWeek,
        name: session.name,
        type: session.type,
        durationMin: session.durationMin,
        estimatedCaloriesBurn: session.estimatedCaloriesBurn,
        isCompleted: session.isCompleted,
        exercises: session.exercises.map((exercise: any) => ({
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          durationMin: exercise.durationMin,
          isCompleted: exercise.isCompleted,
        })),
      })),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="fitness-plan-${viewParam}.pdf"`
    );
    res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

export default router;
