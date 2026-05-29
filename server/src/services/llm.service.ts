import { z } from "zod";
import { encode } from "@toon-format/toon";
import {
  calculateBMR,
  calculateTDEE,
  adjustCaloriesForGoal,
  calculateMacros,
  activityMultipliers,
} from "../utils/calculations";
import { Meal, UserContext } from "../types";
import { openrouter } from "../configs/llm";
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
  } catch {}

  const match = text.match(/```json([\s\S]*?)```/i);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch {}
  }

  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last !== -1) {
    const sliced = text.slice(first, last + 1);
    try {
      return JSON.parse(sliced);
    } catch {}
  }

  throw new Error("Failed to extract valid JSON from LLM");
};

const MAX_RETRIES = 2;

const callLLMWithRecovery = async <T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  contextValidator?: (data: T) => void,
): Promise<T> => {
  let lastError: any;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const raw = await callOpenRouter(prompt);
      const parsed = extractJSON(raw!);
      const normalized = normalizeLLMOutput(parsed);
      const data = schema.parse(normalized);
      if (contextValidator) contextValidator(data);
      return data;
    } catch (err: any) {
      lastError = err;
      prompt = `The previous response was invalid JSON or didn't match schema.\nERROR:\n${err.message}\nFix it and return ONLY valid JSON matching this schema:\n${schema.toString()}`;
    }
  }
  throw lastError;
};

const normalizeLLMOutput = (data: any) => {
  if (data?.meals) {
    data.meals = data.meals.map((meal: any) => ({
      ...meal,
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
): string => {
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

  return `
You are a professional fitness coach. Generate a structured weekly workout plan.

CONTEXT (TOON):
${toonContext}


PROGRAM SPLIT RULES:
1. "push_pull_legs": Alternate Push (chest, shoulders, triceps), Pull (back, biceps), and Legs (quads, hamstrings, glutes, calves).
2. "upper_lower": Alternate Upper Body and Lower Body training days.
3. "anterior_posterior": Alternate Anterior (front body muscles: chest, quads, shoulders, abs) and Posterior (back body muscles: back, hamstrings, glutes, calves, triceps).
4. "arnold_split": Split by Chest/Back, Shoulders/Arms, and Legs.
5. "full_body": Each training day exercises the whole body (Legs, Chest, Back, Shoulders, Arms, Core).

CONSTRAINTS (STRICT — MUST FOLLOW):
- Total days in plan: 7 (Monday → Sunday)
- Exactly ${training_days} days MUST be training days. The rest (${7 - training_days} days) MUST be flagged as "Recovery" days.
- Recovery days must have "type": "Recovery", "durationMin": 0, "estimatedCaloriesBurn": 0, and "exercises": [] (empty array).
- Each active training session duration MUST be exactly: ${duration} minutes.
- Distribute training days logically across the week (e.g. for a 3-day split: Monday, Wednesday, Friday active; other days recovery).
- EXERCISE NAMING RULES (CRITICAL FOR DATABASE MATCHING):
  1. ONLY use singular, standard gym terminology (e.g., use "Squat" not "Squats", "Lunge" not "Lunges", "Push up" not "Push-ups").
  2. AVOID complex descriptive names. Use exact terms from our standard database whenever possible:
     - "Squat"
     - "Push-up"
     - "Push up"
     - "Lunge"
     - "Deadlift"
     - "Calf raise"
     - "Glute bridge"
     - "Dumbbell row"
     - "Bent over row"
     - "Dumbbell press"
     - "Overhead press"
     - "Bicep curl"
     - "Triceps extension"
     - "Plank"
     - "High knees"
     - "Mountain climber"
     - "Burpee"
     - "Dumbbell step-up"
     - "Jumping jack"
     - "Crunch"
     - "Sit up"
  3. Ensure capitalization is clean and matches the above list. Do NOT invent name variations.

OUTPUT REQUIREMENTS:
- Always return exactly 7 sessions (one per day, Monday through Sunday)
- Respect training_days count strictly (e.g., if 4 → only 4 non-recovery sessions)
- Each session must include:
  - dayOfWeek: "Monday" to "Sunday"
  - name: Workout session name (e.g., "Push Strength Workout" or "Lower Body Focus")
  - type: "Strength" | "Cardio" | "Yoga" | "Mixed" | "Recovery"
  - durationMin: number (use ${duration} for training, 0 for recovery)
  - estimatedCaloriesBurn: number (0 for recovery)
  - exercises: [] (empty array for recovery days)

EXERCISE FORMAT:
- exercises: [{ name: string, sets: number, reps: string }]
- Use realistic sets/reps based on goal and experience

OUTPUT VALID JSON ONLY:
{
  "sessions": [
    {
      "dayOfWeek": "Monday",
      "name": "Push Strength Focus",
      "type": "Strength",
      "durationMin": ${duration},
      "estimatedCaloriesBurn": 420,
      "exercises": [
        {"name": "Bench Press", "sets": 4, "reps": "8-10"},
        {"name": "Overhead press", "sets": 3, "reps": "10"},
        {"name": "Triceps extension", "sets": 3, "reps": "12"}
      ]
    }
  ]
}
`;
};

const generateMealPlanPrompt = (
  user: UserContext,
  mealsCount: number = 3,
  snacksCount: number = 0,
  favoriteFoods: string[] = [],
  repeatMealsEveryDay: boolean = false,
): string => {
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

  // Latency optimization: If repeating meals, only generate Day 1 and programmatically copy
  const daysToGenerate = repeatMealsEveryDay ? 1 : 7;
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

  return `
You are a professional nutritionist. Generate a personalized ${daysToGenerate}-day meal plan.

USER CONTEXT (TOON):
${toonContext}

STRICT RULES (MUST FOLLOW — NO EXCEPTIONS):

⚠️ CRITICAL — ITEM COUNT (HIGHEST PRIORITY):
   - Generate EXACTLY ${totalItemsCount} items total across the entire response (${expectedMeals} meals + ${expectedSnacks} snacks)
   - The plan MUST cover EXACTLY the following days: ${repeatMealsEveryDay ? "Day 1 only" : "Day 1 through Day 7"}
   - Set "mealType": "meal" for meals and "mealType": "snack" for snacks
   - THIS RULE OVERRIDES ALL OTHERS. If you must choose between item count and any other rule, preserve the item count.

1. CALORIES & MACROS:
   - Each day MUST total ~${calories} kcal (±50 kcal)
   - Distribute calories across ${totalItemsPerDay} items per day
   - Meals should be larger (approx 70-80% of daily calories), snacks lighter (20-30%)
   - Adjust macro distribution based on goal:
     - lose_weight → higher protein, moderate fats, lower carbs
     - gain_weight → higher carbs + protein
     - balance_weight → balanced macros

2. ALLERGIES (CRITICAL):
   - NEVER include any ingredient listed in allergies
   - If common protein sources are restricted, substitute with safe alternatives
   - Adapt macro sources intelligently (e.g., legumes, plant protein, fish if allowed)

3. RELIGION RULES (CRITICAL):
   - If religion = "muslim":
     - STRICTLY FORBIDDEN: pork, alcohol, any non-halal ingredients
   - If religion = "christian" AND isFasting = true:
     - STRICTLY FORBIDDEN: ALL animal products (meat, chicken, fish, eggs, dairy, cheese, milk, butter)
     - Meals MUST be 100% plant-based (vegan)

4. FOOD QUALITY & CONCISE FORMAT (CRITICAL FOR PERFORMANCE & LATENCY):
   - Use realistic, culturally neutral meals
   - Prefer whole foods over processed foods
   ${repeatMealsEveryDay ? "- Since repeatMealsEveryDay is true, you only need to output Day 1. It will be duplicated programmatically." : "- Enforce variety throughout the week. Avoid repeating the same meals from day to day. Every day should have a unique and different menu."}
   - Keep ingredient lists concise (4-8 per meal, 1-3 per snack). ONLY include substantial ingredients with meaningful nutritional value. EXCLUDE salt, pepper, individual spices/herbs, cooking oil, vinegar, garlic, etc.
   - Keep instructions extremely concise: maximum 3 simple, short steps per meal (e.g., "Boil pasta", "Mix with tuna", "Serve"). Avoid long descriptive paragraphs. This dramatically reduces latency.

5. STRUCTURE:
   - Meal times (approximate):
     - Breakfast → "08:00 AM"
     - Lunch → "12:30 PM"
     - Dinner → "07:00 PM"
     ${snacksCount > 0 ? `- Snacks → "10:30 AM", "03:30 PM" (distribute snacks across day)` : ""}

⚠️ REMINDER — COUNT YOUR OUTPUT:
- You MUST output EXACTLY ${totalItemsCount} total items (${expectedMeals} meals + ${expectedSnacks} snacks)
- Verify your count before responding. Wrong count will be rejected.

OUTPUT FORMAT (STRICT JSON ONLY — NO TEXT):
{
  "meals": [
    {
      "day": "Day 1",
      "name": "Meal name",
      "time": "08:00 AM",
      "mealType": "meal",
      "macros": {
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fats": 0
      },
      "ingredients": [
        { "name": "ingredient", "quantity": 100, "unit": "g" }
      ],
      "instructions": ["step 1", "step 2"]
    }
  ],
  "targetMacros": {
    "calories": ${calories},
    "protein": ${protein},
    "carbs": ${carbs},
    "fats": ${fats}
  }
}
`;
};

export const generateMealPlan = async (
  user: UserContext,
  mealsCount: number = 3,
  snacksCount: number = 0,
  favoriteFoods: string[] = [],
  repeatMealsEveryDay: boolean = false,
): Promise<MealPlanResponse> => {
  const prompt = generateMealPlanPrompt(
    user,
    mealsCount,
    snacksCount,
    favoriteFoods,
    repeatMealsEveryDay,
  );

  const daysToGenerate = repeatMealsEveryDay ? 1 : 7;
  const expectedMeals = mealsCount * daysToGenerate;
  const expectedSnacks = snacksCount * daysToGenerate;

  const response = await callLLMWithRecovery(
    prompt,
    mealPlanResponseSchema,
    (data) => {
      const mealCount = data.meals.filter((m) => m.mealType === "meal").length;
      const snackCount = data.meals.filter(
        (m) => m.mealType === "snack",
      ).length;
      if (mealCount !== expectedMeals || snackCount !== expectedSnacks) {
        throw new Error(
          `Count mismatch: expected ${expectedMeals} meals + ${expectedSnacks} snacks ` +
            `(= ${mealsCount} meals + ${snacksCount} snacks per day for ${daysToGenerate} days) ` +
            `but got ${mealCount} meals + ${snackCount} snacks. ` +
            `Regenerate with EXACTLY ${mealsCount} meals and ${snacksCount} snacks per day.`,
        );
      }
    },
  );

  if (repeatMealsEveryDay) {
    const day1Meals = response.meals;
    const expandedMeals: any[] = [];
    for (let d = 1; d <= 7; d++) {
      for (const m of day1Meals) {
        expandedMeals.push({
          ...m,
          day: `Day ${d}`,
        });
      }
    }
    response.meals = expandedMeals as any;
  }

  return response;
};

export const generateWorkoutPlan = async (
  user: UserContext,
  trainingProgram: string = "full_body",
  trainingDays: number = 3,
  duration: number = 60,
): Promise<WorkoutPlanResponse> => {
  const prompt = generateWorkoutPlanPrompt(
    user,
    trainingDays,
    trainingProgram,
    duration,
  );

  return callLLMWithRecovery(prompt, workoutPlanResponseSchema);
};

export const refineMeal = async (
  currentMeal: Meal,
  refinementPrompt: string,
  user: UserContext,
): Promise<MealPlanRefineResponse> => {
  const prompt = `
Return ONLY valid JSON.

Schema:
${mealSchema.toString()}

Rules:
- Keep same calories exactly
- Keep macros within ±5%
- Respect restrictions & allergies

Meal (TOON format):
${encode(currentMeal)}

User request:
${refinementPrompt}
`;

  return callLLMWithRecovery(prompt, mealSchema);
};

export const regenerateMeal = async (
  meal: Meal,
  user: UserContext,
): Promise<MealPlanRefineResponse> => {
  const prompt = `
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
10. Keep measurements practical (grams, cups, tbsp, pieces, etc.).
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
  return callLLMWithRecovery(prompt, mealSchema);
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

const callOpenRouter = async (prompt: string) => {
  console.log("LLM Prompt:", prompt);

  const completion = await openrouter.chat.completions.create({
    model: "qwen/qwen3-vl-32b-instruct",
    max_tokens: 12000,
    temperature: 0.2, // reduce randomness
    messages: [
      {
        role: "system",
        content:
          "You are a strict JSON API. Return ONLY valid JSON. No markdown, no text.",
      },
      { role: "user", content: prompt },
    ],
  });
  for (const choice of completion.choices) {
    if (!choice.message?.content) {
      throw new Error("LLM did not return any content");
    }
    const content = choice.message.content.trim();
    console.log("LLM Raw Response:", content);
  }
  return completion.choices[0]?.message?.content ?? null;
};
