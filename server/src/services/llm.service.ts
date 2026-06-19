import { z } from "zod";
import { encode } from "@toon-format/toon";
import { env } from "../configs/env";
import {
  calculateBMR,
  calculateTDEE,
  adjustCaloriesForGoal,
  calculateMacros,
  activityMultipliers,
} from "../utils/calculations";
import { Meal, UserContext } from "../types";
import { cleanKey } from "../configs/llm";
import OpenAI from "openai";
// import { normalizeMeal } from '../utils/parser';

const ingredientSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: z.string().optional(),
});

export const mealSchema = z.object({
  day: z.string(),
  name: z.string(),
  time: z.string(),
  mealType: z.enum(["meal", "snack"]).default("meal"),
  macros: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fats: z.number(),
  }),
  ingredients: z.array(ingredientSchema),
  instructions: z.array(z.string()),
});

export const mealPlanResponseSchema = z.object({
  meals: z.array(mealSchema),
  targetMacros: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fats: z.number(),
  }),
});

const workoutPlanResponseSchema = z.object({
  sessions: z.array(
    z.object({
      dayOfWeek: z.string(),
      name: z.string(),
      type: z.enum(["Strength", "Cardio", "Yoga", "Mixed", "Recovery"]),
      durationMin: z.number(),
      estimatedCaloriesBurn: z.number(),
      exercises: z.array(
        z.object({
          name: z.string(),
          sets: z.number(),
          reps: z.string(),
          durationMin: z.number().optional(),
        }),
      ),
    }),
  ),
});

export type MealPlanResponse = z.infer<typeof mealPlanResponseSchema>;
export type WorkoutPlanResponse = z.infer<typeof workoutPlanResponseSchema>;
export type MealPlanRefineResponse = z.infer<typeof mealSchema>;

const extractJSON = (text: string): any => {
  if (!text) throw new Error("Empty LLM response");

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("extractJSON: direct parse failed:", (e as Error)?.message?.slice(0, 100));
  }

  const match = text.match(/```json([\s\S]*?)```/i);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.error("extractJSON: code block parse failed:", (e as Error)?.message?.slice(0, 100));
    }
  }

  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last !== -1) {
    const sliced = text.slice(first, last + 1);
    try {
      return JSON.parse(sliced);
    } catch (e) {
      console.error("extractJSON: brace slice parse failed:", (e as Error)?.message?.slice(0, 100));
    }
  }

  // Log a preview of the raw LLM response for debugging
  console.error("extractJSON: all parse strategies failed. Raw response preview:", text.slice(0, 500));
  throw new Error("Failed to extract valid JSON from LLM");
};

const MAX_RETRIES = 1;

function schemaToExample(schema: z.ZodSchema): string {
  const inner = (s: z.ZodTypeAny): any => {
    if (s instanceof z.ZodString) return "";
    if (s instanceof z.ZodNumber) return 0;
    if (s instanceof z.ZodBoolean) return false;
    if (s instanceof z.ZodArray) return [(s._def as any).type].map(inner);
    if (s instanceof z.ZodEnum) return (s._def as any).values[0];
    if (s instanceof z.ZodDefault) return inner((s._def as any).innerType);
    if (s instanceof z.ZodObject) {
      const obj: any = {};
      for (const [k, v] of Object.entries(s.shape)) {
        obj[k] = inner(v as z.ZodTypeAny);
      }
      return obj;
    }
    if (s instanceof z.ZodOptional) return inner((s._def as any).innerType);
    if (s instanceof z.ZodNullable) return inner((s._def as any).innerType);
    return null;
  };
  return JSON.stringify(inner(schema), null, 2);
}

const callLLMWithRecovery = async <T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  contextValidator?: (data: T) => void,
  language: string = "en",
): Promise<T> => {
  let lastError: any;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const raw = await callGemini(prompt, language);
      const parsed = extractJSON(raw!);
      const normalized = normalizeLLMOutput(parsed);
      const data = schema.parse(normalized);
      if (contextValidator) contextValidator(data);
      return data;
    } catch (err: any) {
      lastError = err;
      const schemaDescription = JSON.stringify(schema.toJSONSchema(), null, 2);
      prompt = `The previous response was invalid JSON or didn't match schema.\nERROR:\n${err.message}\nFix it and return ONLY valid JSON matching this schema:\n${schemaDescription}`;
    }
  }
  throw lastError;
};

const dayNameMap: Record<string, string> = {
  monday: "Day 1", mon: "Day 1",
  tuesday: "Day 2", tue: "Day 2",
  wednesday: "Day 3", wed: "Day 3",
  thursday: "Day 4", thu: "Day 4",
  friday: "Day 5", fri: "Day 5",
  saturday: "Day 6", sat: "Day 6",
  sunday: "Day 7", sun: "Day 7",
};

const normalizeDay = (day: string, index: number, itemsPerDay: number): string => {
  if (!day) return `Day ${Math.floor(index / itemsPerDay) + 1}`;
  const lower = day.trim().toLowerCase();
  if (dayNameMap[lower]) return dayNameMap[lower];
  const match = day.match(/^day\s*(\d+)$/i);
  if (match) return `Day ${match[1]}`;
  const num = parseInt(day);
  if (num >= 1 && num <= 7) return `Day ${num}`;
  return `Day ${Math.floor(index / itemsPerDay) + 1}`;
};

const normalizeLLMOutput = (data: any) => {
  if (data?.meals) {
    const itemsPerDay = data.meals.length > 7 ? Math.round(data.meals.length / 7) : 3;
    data.meals = data.meals.map((meal: any, idx: number) => ({
      ...meal,
      day: normalizeDay(meal?.day, idx, itemsPerDay),
      ingredients: meal.ingredients?.map((ing: any) =>
        typeof ing === "string" ? { name: ing, quantity: "" } : ing,
      ),
      macros: {
        calories: Number(meal?.macros?.calories) || 0,
        protein: Number(meal?.macros?.protein) || 0,
        carbs: Number(meal?.macros?.carbs) || 0,
        fats: Number(meal?.macros?.fats) || 0,
      },
    }));
  }

  return data;
};

const generateWorkoutPlanPrompt = (
  user: UserContext,
  training_days: number,
  training_program: string,
  duration: number = 60,
  language: 'en' | 'ar' = 'en',
): string => {
  const isArabic = language === 'ar';
  const activityLevel = user.activityLevel || "moderate";

  const toonContext = encode({
    userProfile: {
      name: user.name,
      activityLevel,
      fitnessGoals: user.fitnessGoals || "general fitness",
    },
    trainingMethod: {
      programSplit: training_program,
      trainingDays: training_days,
      sessionDurationMin: duration,
    },
  });

  const exercisesByDuration: Record<number, number> = {
    30: 4, 45: 5, 60: 7, 75: 8, 90: 10,
  };
  const targetExercises = exercisesByDuration[duration] || Math.round(duration / 9);

  const exerciseDBList = [
    "bench press", "incline bench press", "deadlift", "romanian deadlift",
    "overhead press", "shoulder press", "lateral raise", "front raise",
    "barbell row", "bent over row", "dumbbell row", "pull up", "lat pulldown",
    "bicep curl", "hammer curl",
    "triceps extension", "skull crusher",
    "squat", "barbell squat", "goblet squat", "leg press",
    "leg extension", "leg curl", "lunge", "dumbbell lunge",
    "calf raise", "standing calf raise", "glute bridge", "hip thrust",
    "plank", "side plank", "crunch", "sit up",
    "push up", "mountain climber", "burpee", "jumping jack", "high knees",
    "dumbbell step up", "cable crossover", "face pull", "dumbbell press",
  ];

  const programDescriptions: Record<string, string> = {
    "push_pull_legs": isArabic ? "دفع (صدر+كتف+ترايسبس) | سحب (ظهر+بايسيبس) | أرجل (كواد+هاسترينغ+غلوتس+كاف)" : "Push: Chest+Shoulders+Triceps | Pull: Back+Biceps | Legs: Quads+Hamstrings+Glutes+Calves",
    "upper_lower": isArabic ? "علوي (صدر+ظهر+كتف+ذراعين) | سفلي (أرجل+غلوتس+بطن)" : "Upper: Chest+Back+Shoulders+Arms | Lower: Legs+Glutes+Core",
    "anterior_posterior": isArabic ? "أمامي (صدر+كواد+كتف+بطن) | خلفي (ظهر+هاسترينغ+غلوتس+كاف+ترايسبس)" : "Anterior: Chest+Quads+Shoulders+Abs | Posterior: Back+Hamstrings+Glutes+Calves+Triceps",
    "arnold_split": isArabic ? "صدر+ظهر | كتف+ذراعين | أرجل" : "Chest+Back | Shoulders+Arms | Legs",
    "full_body": isArabic ? "كامل الجسم في كل يوم تدريب" : "Full body each training day",
    "mixed": isArabic ? "مزيج من التقسيمات أعلاه" : "Mix of the above splits",
  };

  const langPrompt = isArabic ? `
أنت مدرب لياقة. أنشئ خطة أسبوعية 7 أيام.

${toonContext}

البرنامج: "${training_program}"
الوصف: ${programDescriptions[training_program] || programDescriptions["mixed"]}

EXERCISE DB (استخدم فقط من هذه القائمة):
${exerciseDBList.join(", ")}

قواعد صارمة:
- بالضبط ${training_days} أيام تدريب + ${7 - training_days} أيام تعافي (type=Recovery, exercises=[])
- اتبع البرنامج بدقة: ${programDescriptions[training_program] || training_program}
- ${duration} دقيقة لكل جلسة تدريب = بالضبط ${targetExercises} تمرين
- نوع التمرين: Strength فقط (ممنوع Cardio/Yoga/Mixed لأيام التدريب)
- dayOfWeek: Monday-Sunday بالإنجليزية
- أسماء التمارين: اختر من ExerciseDB أعلاه فقط, تطابق تام
- أسماء جلسات التمرين بالعربية
- 3 مجموعات لكل تمرين, \`reps\` كنطاق (مثل "8-12" أو "10-15")

أخرج JSON فقط:
{"sessions":[{"dayOfWeek":"Monday","name":"","type":"Strength","durationMin":${duration},"estimatedCaloriesBurn":0,"exercises":[{"name":"","sets":3,"reps":"8-12"}]}]}
` : `
You are a fitness coach. Generate a 7-day weekly plan.

${toonContext}

Program: "${training_program}"
Description: ${programDescriptions[training_program] || programDescriptions["mixed"]}

EXERCISE DB (use ONLY from this list):
${exerciseDBList.join(", ")}

STRICT RULES:
- Exactly ${training_days} training days + ${7 - training_days} Recovery days (type=Recovery, exercises=[])
- Follow the program split precisely: ${programDescriptions[training_program] || training_program}
- ${duration}min per session = exactly ${targetExercises} exercises
- Training type: Strength only (no Cardio/Yoga/Mixed)
- dayOfWeek: Monday-Sunday
- Exercise names: pick EXACT MATCHES from Exercise DB list above, no variations
- 3 sets per exercise, reps as range (e.g. "8-12" or "10-15")

Output JSON only:
{"sessions":[{"dayOfWeek":"Monday","name":"","type":"Strength","durationMin":${duration},"estimatedCaloriesBurn":0,"exercises":[{"name":"","sets":3,"reps":"8-12"}]}]}
`;

  return langPrompt;
};

const generateMealPlanPrompt = (
  user: UserContext,
  mealsCount: number = 3,
  snacksCount: number = 0,
  favoriteFoods: string[] = [],
  repeatMealsEveryDay: boolean = false,
  language: 'en' | 'ar' = 'en',
  specificDay?: number,
): string => {
  const isArabic = language === 'ar';
  const bmr = calculateBMR(user);
  const tdee = calculateTDEE(user, bmr);
  const dailyCalories = adjustCaloriesForGoal(tdee, user.goal);
  const targetMacros = calculateMacros(dailyCalories, user);
  const { calories, protein, carbs, fats } = targetMacros;
  const activityLevel = user.activityLevel || "moderate";
  const activityDesc =
    Object.entries(activityMultipliers)
      .filter(([key]) => key === activityLevel)
      .map(([, val]) => `${val}x basal metabolic rate`)[0] || "1.55x";
  const restrictions = user.dietaryRestrictions?.length
    ? `Dietary restrictions: ${user.dietaryRestrictions}`
    : "";
  const totalItemsPerDay = mealsCount + snacksCount;

  // Latency optimization: If repeating meals or doing single day, only generate 1 day
  const daysToGenerate = (repeatMealsEveryDay || specificDay !== undefined) ? 1 : 7;
  const totalItemsCount = totalItemsPerDay * daysToGenerate;
  const expectedMeals = mealsCount * daysToGenerate;
  const expectedSnacks = snacksCount * daysToGenerate;

  const toonContext = encode({
    userProfile: {
      name: user.name,
      targetDailyCaloriesKcal: calories,
      targetMacros: { proteinG: protein, carbsG: carbs, fatsG: fats },
      activityLevel: `${activityLevel} (${activityDesc})`,
      goal: user?.goal || "balance_weight",
      fitnessGoals: user?.fitnessGoals || "general fitness",
    },
    dietaryContext: {
      restrictions: restrictions || "none",
      allergies: user?.allergies || "none",
      religion: user?.religion || "none",
      christianFasting: user?.isFasting ?? false,
      favoriteFoods: favoriteFoods || [],
    },
  });

  const langPrompt = isArabic ? `
أنت خبير تغذية. أنشئ خطة ${specificDay !== undefined ? `اليوم ${specificDay}` : `${daysToGenerate} أيام`}.

${toonContext}

قواعد صارمة:
- بالضبط ${totalItemsCount} عنصر (${expectedMeals} وجبات + ${expectedSnacks} وجبات خفيفة)
- الغطاء: ${specificDay !== undefined ? `اليوم ${specificDay} فقط` : (repeatMealsEveryDay ? "اليوم 1 فقط" : "اليوم 1 إلى 7")}
- يجب أن يكون حقل "day" لجميع الوجبات والوجبات الخفيفة هو "${isArabic ? `اليوم ${specificDay || 1}` : `Day ${specificDay || 1}`}" بالضبط.
- mealType: "meal" للوجبات، "snack" للوجبات الخفيفة
- ~${calories} سعرة/يوم (±50)
- ${totalItemsPerDay} عنصر/يوم (وجبات 70-80%, وجبات خفيفة 20-30%)
- ضبط المغغيات حسب الهدف
- لا تستخدم مكونات من قائمة الحساسية
- الحالات المزمنة (السكري, الضغط, مقاومة الأنسولين..الخ): قدّم وجبات مناسبة لكل حالة (مثلاً قليل السكر للسكري, قليل الملح للضغط)
- الدين "muslim": لا لحم خنزير, لا كحول, حلال فقط
- الدين "christian" والصيام: نباتي 100%
${(repeatMealsEveryDay || specificDay !== undefined) ? `- كرر اليوم ${specificDay || 1} فقط` : "- تنويع يومي"}
- المكونات: 4-8 للوجبة, 1-3 للوجبة الخفيفة
- قواعد صارمة لوحدات المكونات (حقل unit):
  * للعناصر القابلة للعد (مثل التفاح، البرتقال، البيض، الموز، الفواكه/الخضروات الكاملة)، يجب أن تكون الوحدة "piece" بالإنجليزية بالضبط.
  * للمواد الثقيلة والنشويات والبروتينات الصلبة أو الجافة (مثل اللحم، الدجاج، الأرز، المعكرونة، الشوفان)، يجب أن تكون الوحدة "g" أو "kg" بالإنجليزية.
  * للسوائل (مثل الحليب، الماء، الزيت، العصير)، يجب أن تكون الوحدة "l" أو "ml" بالإنجليزية.
  * يُمنع منعاً باتاً استخدام أي وحدات أخرى مثل "كوب"، "ملعقة"، "رشة"، "حفنة"، إلخ.
- التعليمات: 3 خطوات كحد أقصى
- التوقيت: فطور 08:00, غداء 12:30, عشاء 19:00${snacksCount > 0 ? ", وجبات خفيفة 10:30, 15:30" : ""}
- أسماء الوجبات والمكونات والتعليمات بالعربية
- أضف تصنيف الوجبة قبل الاسم: "فطور: " للإفطار، "غداء: " للغداء، "عشاء: " للعشاء، "وجبة خفيفة: " للوجبات الخفيفة
- مثال: "فطور: عجة البيض مع توست وأفوكادو" وليس "عجة البيض مع توست وأفوكادو"
- مفاتيح JSON بالإنجليزية, القيم بالعربية

أخرج JSON فقط:
{"meals":[{"day":"${isArabic ? `اليوم ${specificDay || 1}` : `Day ${specificDay || 1}`}","name":"فطور: اسم الوجبة","time":"08:00","mealType":"meal","macros":{"calories":0,"protein":0,"carbs":0,"fats":0},"ingredients":[{"name":"","quantity":100,"unit":"g"}],"instructions":[""]}],"targetMacros":{"calories":${calories},"protein":${protein},"carbs":${carbs},"fats":${fats}}}
` : `
You are a nutritionist. Generate a ${specificDay !== undefined ? `meal plan for Day ${specificDay} only` : `${daysToGenerate}-day meal plan`}.

${toonContext}

STRICT RULES:
- EXACTLY ${totalItemsCount} items (${expectedMeals} meals + ${expectedSnacks} snacks)
- Cover: ${specificDay !== undefined ? `Day ${specificDay} only` : (repeatMealsEveryDay ? "Day 1 only" : "Day 1 through Day 7")}
- The "day" property for all meals and snacks MUST be exactly "${isArabic ? `اليوم ${specificDay || 1}` : `Day ${specificDay || 1}`}".
- mealType: "meal" or "snack"
- ~${calories} kcal/day (±50), ${totalItemsPerDay} items/day
- Meals 70-80% of calories, snacks 20-30%
- Adjust macros by goal (lose: high protein, gain: high carb+protein, balance: even)
- NEVER use listed allergens
- Chronic conditions (diabetes, hypertension, insulin resistance, etc): tailor meals accordingly (low sugar for diabetes, low sodium for hypertension, etc)
- muslim: NO pork/alcohol, halal only
- christian + fasting: 100% vegan
${(repeatMealsEveryDay || specificDay !== undefined) ? `- Repeat Day ${specificDay || 1} only` : "- Vary daily, no repeats"}
- Ingredients: 4-8/meal, 1-3/snack (exclude salt, spices, oil)
- STRICT Ingredient Units (for the unit field):
  * For countable/whole items (e.g., apple, orange, banana, egg, whole fruits/vegetables), the unit MUST be exactly "piece".
  * For heavy, solid, or dry carbs/proteins (e.g., meat, chicken, fish, rice, pasta, oats, flour), the unit MUST be exactly "g" or "kg".
  * For liquids (e.g., milk, water, oil, juice), the unit MUST be exactly "l" or "ml".
  * NEVER use any other units like "cup", "tbsp", "tsp", "handful", etc.
- Instructions: max 3 short steps
- Times: Breakfast 08:00, Lunch 12:30, Dinner 19:00${snacksCount > 0 ? ", Snacks 10:30, 15:30" : ""}
- Prefix meal names with type label: "Breakfast: ", "Lunch: ", "Dinner: ", "Snack: "
- Example: "Breakfast: Omelet Eggs with Toast and Avocado" not just "Omelet Eggs with Toast and Avocado"

Output JSON ONLY:
{"meals":[{"day":"${isArabic ? `اليوم ${specificDay || 1}` : `Day ${specificDay || 1}`}","name":"Breakfast: meal name","time":"08:00","mealType":"meal","macros":{"calories":0,"protein":0,"carbs":0,"fats":0},"ingredients":[{"name":"","quantity":100,"unit":"g"}],"instructions":[""]}],"targetMacros":{"calories":${calories},"protein":${protein},"carbs":${carbs},"fats":${fats}}}
`;

  return langPrompt;
};

export const generateMealPlan = async (
  user: UserContext,
  mealsCount: number = 3,
  snacksCount: number = 0,
  favoriteFoods: string[] = [],
  repeatMealsEveryDay: boolean = false,
  language: 'en' | 'ar' = 'en',
): Promise<MealPlanResponse> => {
  const isArabic = language === 'ar';

  if (repeatMealsEveryDay) {
    const prompt = generateMealPlanPrompt(
      user,
      mealsCount,
      snacksCount,
      favoriteFoods,
      true,
      language,
    );

    const response = await callLLMWithRecovery(
      prompt,
      mealPlanResponseSchema,
      undefined, // No strict validator to avoid crashing, we do robust self-healing below!
      language,
    );

    // Self-healing for Day 1
    let dayMeals = response.meals.filter((m) => m.mealType === "meal" || !m.mealType);
    let daySnacks = response.meals.filter((m) => m.mealType === "snack");
    dayMeals.forEach((m) => (m.mealType = "meal"));

    if (dayMeals.length > mealsCount) {
      dayMeals = dayMeals.slice(0, mealsCount);
    } else if (dayMeals.length < mealsCount && dayMeals.length > 0) {
      while (dayMeals.length < mealsCount) {
        dayMeals.push({ ...dayMeals[0] });
      }
    }

    if (daySnacks.length > snacksCount) {
      daySnacks = daySnacks.slice(0, snacksCount);
    } else if (daySnacks.length < snacksCount && daySnacks.length > 0) {
      while (daySnacks.length < snacksCount) {
        daySnacks.push({ ...daySnacks[0] });
      }
    }

    const day1Meals = [...dayMeals, ...daySnacks];
    const expandedMeals: any[] = [];
    for (let d = 1; d <= 7; d++) {
      for (const m of day1Meals) {
        expandedMeals.push({
          ...m,
          day: isArabic ? `اليوم ${d}` : `Day ${d}`,
        });
      }
    }
    response.meals = expandedMeals as any;
    return response;
  }

  // Generate 7 days of meals in parallel for extremely low latency and high quality
  const promises = Array.from({ length: 7 }, (_, i) => {
    const dayNum = i + 1;
    const prompt = generateMealPlanPrompt(
      user,
      mealsCount,
      snacksCount,
      favoriteFoods,
      false,
      language,
      dayNum,
    );

    return callLLMWithRecovery(
      prompt,
      mealPlanResponseSchema,
      undefined, // No strict validator here, we heal the structure programmatically below!
      language,
    );
  });

  const dayResponses = await Promise.all(promises);

  const allMeals: any[] = [];
  for (let i = 0; i < 7; i++) {
    const dayNum = i + 1;
    const resp = dayResponses[i];

    let dayMeals = resp.meals.filter((m) => m.mealType === "meal" || !m.mealType);
    let daySnacks = resp.meals.filter((m) => m.mealType === "snack");
    
    dayMeals.forEach((m) => (m.mealType = "meal"));

    // Robust slicing or padding
    if (dayMeals.length > mealsCount) {
      dayMeals = dayMeals.slice(0, mealsCount);
    } else if (dayMeals.length < mealsCount && dayMeals.length > 0) {
      while (dayMeals.length < mealsCount) {
        dayMeals.push({ ...dayMeals[0] });
      }
    }

    if (daySnacks.length > snacksCount) {
      daySnacks = daySnacks.slice(0, snacksCount);
    } else if (daySnacks.length < snacksCount && daySnacks.length > 0) {
      while (daySnacks.length < snacksCount) {
        daySnacks.push({ ...daySnacks[0] });
      }
    }

    const dayLabel = isArabic ? `اليوم ${dayNum}` : `Day ${dayNum}`;
    dayMeals.forEach((m) => (m.day = dayLabel));
    daySnacks.forEach((s) => (s.day = dayLabel));

    allMeals.push(...dayMeals, ...daySnacks);
  }

  return {
    meals: allMeals,
    targetMacros: dayResponses[0].targetMacros,
  };
};

export const generateWorkoutPlan = async (
  user: UserContext,
  trainingProgram: string = "full_body",
  trainingDays: number = 3,
  duration: number = 60,
  language: 'en' | 'ar' = 'en',
): Promise<WorkoutPlanResponse> => {
  const prompt = generateWorkoutPlanPrompt(
    user,
    trainingDays,
    trainingProgram,
    duration,
    language,
  );

  return callLLMWithRecovery(prompt, workoutPlanResponseSchema, undefined, language);
};

export const refineMeal = async (
  currentMeal: Meal,
  refinementPrompt: string,
  user: UserContext,
  language: 'en' | 'ar' = 'en',
): Promise<MealPlanRefineResponse> => {
  const isArabic = language === 'ar';
  const prompt = isArabic ? `
أعد JSON صالح فقط.

⚠️ مهم: مفاتيح JSON كلها بالإنجليزية (calories, protein, carbs, fats, mealType, day, name, time, macros, ingredients, instructions). لا تترجم المفاتيح. فقط القيم (النصوص) تكون بالعربية.

المخطط:
${mealSchema.toString()}

القواعد:
- حافظ على نفس السعرات بالضبط
- حافظ على المغذيات ضمن ±5%
- احترم القيود والحساسية
- قواعد صارمة لوحدات المكونات (حقل unit):
  * للعناصر القابلة للعد (مثل التفاح، البرتقال، البيض، الموز، الفواكه/الخضروات الكاملة)، يجب أن تكون الوحدة "piece" بالإنجليزية بالضبط.
  * للمواد الثقيلة والنشويات والبروتينات الصلبة أو الجافة (مثل اللحم، الدجاج، الأرز، المعكرونة، الشوفان)، يجب أن تكون الوحدة "g" أو "kg" بالإنجليزية.
  * للسوائل (مثل الحليب، الماء، الزيت، العصير)، يجب أن تكون الوحدة "l" أو "ml" بالإنجليزية.
  * يُمنع منعاً باتاً استخدام أي وحدات أخرى مثل "كوب"، "ملعقة"، "رشة"، "حفنة"، إلخ.

الوجبة (TOON):
${encode(currentMeal)}

طلب المستخدم:
${refinementPrompt}

أخرج أسماء الوجبات والمكونات باللغة العربية.
` : `
Return ONLY valid JSON.

Schema:
${mealSchema.toString()}

Rules:
- Keep same calories exactly
- Keep macros within ±5%
- Respect restrictions & allergies
- STRICT Ingredient Units (for the unit field):
  * For countable/whole items (e.g., apple, orange, banana, egg, whole fruits/vegetables), the unit MUST be exactly "piece".
  * For heavy, solid, or dry carbs/proteins (e.g., meat, chicken, fish, rice, pasta, oats, flour), the unit MUST be exactly "g" or "kg".
  * For liquids (e.g., milk, water, oil, juice), the unit MUST be exactly "l" or "ml".
  * NEVER use any other units like "cup", "tbsp", "tsp", "handful", etc.

Meal (TOON format):
${encode(currentMeal)}

User request:
${refinementPrompt}
`;

  return callLLMWithRecovery(prompt, mealSchema, undefined, language);
};

export const regenerateMeal = async (
  meal: Meal,
  user: UserContext,
  language: 'en' | 'ar' = 'en',
): Promise<MealPlanRefineResponse> => {
  const isArabic = language === 'ar';
  const prompt = isArabic ? `
أنت خبير تغذية بالذكاء الاصطناعي.

مهمتك هي إعادة توليد الوجبة المقدمة باستخدام مكونات مختلفة مع الحفاظ على الملف الغذائي واحترام القيود الغذائية للمستخدم.

أعد JSON صالح فقط.

⚠️ مهم: مفاتيح JSON كلها بالإنجليزية (calories, protein, carbs, fats, mealType, day, name, time, macros, ingredients, instructions). لا تترجم المفاتيح. فقط القيم (النصوص) تكون بالعربية.

المخطط:
${mealSchema.toString()}

قواعد صارمة:
1. توليد نسخة جديدة من الوجبة بمكونات مختلفة
2. الحفاظ على السعرات الحرارية الإجمالية قدر الإمكان (±3%)
3. الحفاظ على البروتين والكربوهيدرات والدهون ضمن ±5%
4. احترام جميع الحساسية والقيود الغذائية والدينية
5. قواعد صارمة لوحدات المكونات (حقل unit):
  * للعناصر القابلة للعد (مثل التفاح، البرتقال، البيض، الموز، الفواكه/الخضروات الكاملة)، يجب أن تكون الوحدة "piece" بالإنجليزية بالضبط.
  * للمواد الثقيلة والنشويات والبروتينات الصلبة أو الجافة (مثل اللحم، الدجاج، الأرز، المعكرونة، الشوفان)، يجب أن تكون الوحدة "g" أو "kg" بالإنجليزية.
  * للسوائل (مثل الحليب، الماء، الزيت، العصير)، يجب أن تكون الوحدة "l" أو "ml" بالإنجليزية.
  * يُمنع منعاً باتاً استخدام أي وحدات أخرى مثل "كوب"، "ملعقة"، "رشة"، "حفنة"، إلخ.
6. أسماء الوجبات والمكونات والتعليمات باللغة العربية

سياق المستخدم:
الحساسية: ${user.allergies?.join(", ") || "لا يوجد"}
الدين: ${user.religion || "لا يوجد"}
الصيام: ${Boolean(user.isFasting)}

الوجبة الأصلية (TOON):
${encode(meal)}
` : `
You are a professional nutritionist AI.

Your task is to regenerate the provided meal using DIFFERENT ingredients while preserving the nutritional profile and respecting the user's dietary constraints.

Return ONLY valid JSON.
Do NOT return markdown.
Do NOT add explanations, comments, or extra text.

JSON Schema:
${mealSchema.toString()}

STRICT RULES:
1. Generate a NEW variation of the meal using different ingredients whenever possible.
2. Preserve the TOTAL calories as closely as possible.
3. Keep calories within ±3%.
4. Keep protein, carbs, and fats within ±5%.
5. Maintain similar meal volume and satiety.
6. Respect ALL allergies, intolerances, dietary restrictions, and religious constraints.
7. Never include forbidden ingredients.
8. If the user is fasting, ensure the meal is suitable for fasting.
9. Prefer realistic ingredient substitutions.
10. STRICT Ingredient Units (for the unit field):
  * For countable/whole items (e.g., apple, orange, banana, egg, whole fruits/vegetables), the unit MUST be exactly "piece".
  * For heavy, solid, or dry carbs/proteins (e.g., meat, chicken, fish, rice, pasta, oats, flour), the unit MUST be exactly "g" or "kg".
  * For liquids (e.g., milk, water, oil, juice), the unit MUST be exactly "l" or "ml".
  * NEVER use any other units like "cup", "tbsp", "tsp", "handful", etc.
11. Keep the meal culturally and nutritionally coherent.
12. Do not remove major meal components unless necessary.
13. Ensure the generated meal is complete and edible in real life.
14. Preserve the meal type (breakfast stays breakfast, etc.).
15. Do not repeat the exact same ingredients unless required to preserve macros.
16. Keep ingredient count reasonable and realistic.
17. Output MUST strictly follow the provided schema.

USER CONTEXT:
Allergies:
${user.allergies?.join(", ") || "None"}

Religion:
${user.religion || "None"}

Fasting:
${Boolean(user.isFasting)}

ORIGINAL MEAL (TOON format):
${encode(meal)}
`;
  return callLLMWithRecovery(prompt, mealSchema, undefined, language);
};
// models
// - inclusionai/ring-2.6-1t:free
// - inclusionai/ling-2.6-1t:free
// - openai/gpt-oss-120b:free
// - nvidia/nemotron-3-nano-30b-a3b:free
// - nvidia/nemotron-3-super-120b-a12b:free
// - inclusionai/ring-2.6-1t:free
// - google/gemma-4-31b-it:free
// - google/gemma-4-26b-a4b-it:free
// - qwen/qwen3-vl-32b-instruct
// - qwen/qwen3-embedding-4b
// - qwen/qwen3-vl-32b-instruct
// - z-ai/glm-4.5-air:free
// - qwen/qwen3-next-80b-a3b-instruct:free
// - qwen/qwen3-coder:free
// - deepseek/deepseek-v4-flash

const callGemini = async (prompt: string, language: string = "en") => {
  const isArabic = language.toLowerCase() === "ar";

  const client = new OpenAI({
    apiKey: cleanKey(env.GEMINI_API_KEY),
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
  });
  const model = isArabic ? env.GEMINI_MODEL_AR : env.GEMINI_MODEL_EN;

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are a strict JSON API. Return ONLY valid JSON. No markdown, no text.",
      },
      { role: "user", content: prompt },
    ],
  });
  const firstChoice = completion.choices[0];
  if (!firstChoice?.message?.content) {
    throw new Error("LLM did not return any content");
  }
  return firstChoice.message.content.trim();
};
