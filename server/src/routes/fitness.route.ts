import User from '../models/user.model';
import WeeklyFitnessPlan from '../models/fitness.model';

import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../middlewares/validateResource';
import { generateWorkoutPlanSchema, completeSessionSchema } from '../dtos/nutrition.dto';
import { authMiddleware, type AuthRequest } from '../middlewares/authMiddleware';
import { generateWorkoutPlan } from '../services/llm.service';
import { awardPoints } from '../services/gamification.service';
import { UserContext } from '../types';
import { generatePDF } from '../services/pdf.service';
import { fetchExerciseDetails } from '../services/exercisedb.service';
import { env } from '../configs/env';

const router = Router();


export const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

router.post('/generate', authMiddleware, validate(generateWorkoutPlanSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const { duration, equipment } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingPlan = await WeeklyFitnessPlan.findOne({ userId }).sort({ createdAt: -1 });
    if (existingPlan && existingPlan.endDate > new Date()) {
      return res.status(403).json({
        error: `This workout plan is still active. You can generate a new plan after ${existingPlan.endDate.toLocaleDateString()}.`,
      });
    }

    const userContext: UserContext = {
      name: user.name,
      weight: user.weight,
      height: user.height,
      age: user.age,
      gender: user.gender,
      activityLevel: user.activityLevel,
      fitnessGoals: user.fitnessGoals,
      goal: user.goal,
      allergies: user.allergies,
      dietaryRestrictions: user.dietaryRestrictions,
      equipment: user.equipment,
    };

    const plan = await generateWorkoutPlan(
      userContext,
      equipment || user.equipment || [],
      duration || 60
    );

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    // =========================================================
    // التعديل الجديد: نلف على التمارين ونجيب الصور مع تأخير بسيط
    // =========================================================
    for (const session of plan.sessions) {
      if (!session.exercises || session.exercises.length === 0) continue;

      for (const exercise of session.exercises) {
        // نستدعي الـ API
        const exerciseData = await fetchExerciseDetails(exercise.name);
        console.log(`[DEBUG] Exercise: ${exercise.name} ->`, exerciseData);
        if (exerciseData) {
          // نربط البيانات
          (exercise as any).exerciseId = exerciseData.exerciseId;
          (exercise as any).gifUrl = exerciseData.gifUrl;
        }

        // 2. هذي الفرملة: ننتظر 400 جزء من الثانية قبل التمرين اللي بعده
        await delay(400); 
      }
    }

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
  authMiddleware,
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

router.get('/current', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    const dateParam = req.query.date as 'day' | 'week';

    if (!dateParam) {
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
      workouts = workoutPlan?.sessions.filter((s) => s.dayOfWeek === currentDay);
    }

    res.status(200).json({
      data: workouts ? workouts : "No workouts scheduled for today.",
      planEndDate: workoutPlan?.endDate || null,
    });
  } catch (error) {
    next(error);
  }
});

router.get(
  '/exercise-image/:exerciseId',
  async (req: Request, res: Response) => {
    try {
      const { exerciseId } = req.params;
      
      const response = await fetch(
        `https://exercisedb.p.rapidapi.com/image?exerciseId=${exerciseId}&resolution=360`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-key': env.RAPIDAPI_KEY,
            'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
          },
        }
      );

      if (!response.ok) {
        return res.status(404).json({ message: 'Image not found' });
      }

      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/gif';
      res.setHeader('Content-Type', contentType);
      // نحفظ الصورة في كاش المتصفح لمدة شهر عشان نوفر استهلاك الـ API
      res.setHeader('Cache-Control', 'public, max-age=2592000'); 
      
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error('Error fetching exercise image:', error);
      res.status(500).json({ message: 'Error fetching image' });
    }
  }
);



export default router;