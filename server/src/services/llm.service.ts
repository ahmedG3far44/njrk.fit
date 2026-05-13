import { z } from "zod";
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
  mealType: z.enum(['meal', 'snack']).default('meal'),
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
  } catch { }

  // محاولة استخراج من code block
  const match = text.match(/```json([\s\S]*?)```/i);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch { }
  }

  // fallback: حاول قص أول وأخر { }
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last !== -1) {
    const sliced = text.slice(first, last + 1);
    try {
      return JSON.parse(sliced);
    } catch { }
  }

  throw new Error("Failed to extract valid JSON from LLM");
};

const MAX_RETRIES = 2;

const callLLMWithRecovery = async <T>(
  prompt: string,
  schema: z.ZodSchema<T>,
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const raw = await callOpenRouter(prompt);
      const parsed = extractJSON(raw!);

      const normalized = normalizeLLMOutput(parsed);

      return schema.parse(normalized);
    } catch (err: any) {
      lastError = err;

      // retry with correction prompt
      prompt = `
The previous response was invalid JSON or didn't match schema.

ERROR:
${err.message}

Fix it and return ONLY valid JSON matching this schema:

${schema.toString()}
`;
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
  equipment: string[],
  duration: number = 60,
): string => {
  const equip =
    equipment?.length > 0 ? equipment : "Gym equipment available for use";
  const activityLevel = user.activityLevel || "moderate";

  return `
You are a professional fitness coach. Generate a structured weekly workout plan.

USER PROFILE:
- Name: ${user.name}
- Activity level: ${activityLevel}
- Fitness goals: ${user.fitnessGoals || "general fitness"}

CONSTRAINTS (STRICT — MUST FOLLOW):
- Training days per week: ${training_days}
- Total days in plan: 7 (Monday → Sunday)
- Days NOT used for training MUST be marked as "Recovery"
- Each training session duration MUST be exactly: ${duration} minutes
- Only use exercises that match available equipment: ${equip}
- If equipment is "bodyweight", do NOT include gym equipment exercises
- Distribute training days logically across the week (no clustering all in a row unless necessary)
- Include variety: Strength, Cardio, Mixed, Yoga (if appropriate)
- Recovery days must NOT include exercises

OUTPUT REQUIREMENTS:
- Always return exactly 7 sessions (one per day)
- Respect training_days count strictly (e.g., if 4 → only 4 non-recovery sessions)
- Each session must include:
- dayOfWeek: "Monday" to "Sunday"
  - name: Workout name
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
      "name": "Upper Body Strength",
      "type": "Strength",
      "durationMin": ${duration},
      "estimatedCaloriesBurn": 400,
      "exercises": [
        {"name":"Push-ups","sets":3,"reps":"10-15"}
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
  const favFoods = favoriteFoods?.length
    ? `Favorite foods (incorporate these where possible): ${favoriteFoods.join(", ")}`
    : "";

  return `
You are a professional nutritionist. Generate a personalized 7-day meal plan.

USER PROFILE:
- Name: ${user.name}
- Target daily calories: ${calories} kcal
- Target macros: Protein ${protein}g, Carbs ${carbs}g, Fats ${fats}g
- Activity level: ${activityLevel} (${activityDesc})
- Goal: ${user?.goal || "balance_weight"}
- Fitness goals: ${user?.fitnessGoals || "general fitness"}

USER DIETARY CONTEXT:
- Restrictions: ${restrictions || "none"}
- Allergies: ${user?.allergies || "none"}
- Religion: ${user?.religion || "none"}
- Christian fasting: ${user?.isFasting ?? false}
${favFoods ? `\n${favFoods}` : ""}

STRICT RULES(MUST FOLLOW — NO EXCEPTIONS):
1. CALORIES & MACROS:
   - Each day MUST total ~${calories} kcal (±50 kcal)
   - Distribute calories across ${totalItemsPerDay} items: ${mealsCount} meals + ${snacksCount} snacks
   - Meals should be larger (approx 70-80% of daily calories), snacks lighter (20-30%)
   - Adjust macro distribution based on goal:
     - lose_weight → higher protein, moderate fats, lower carbs
     - gain_weight → higher carbs + protein
     - balance_weight → balanced macros

2. ALLERGIES(CRITICAL):
   - NEVER include any ingredient listed in allergies
   - If common protein sources are restricted, substitute with safe alternatives
   - Adapt macro sources intelligently(e.g., legumes, plant protein, fish if allowed)

3. RELIGION RULES(CRITICAL):
   - If religion = "muslim":
     - STRICTLY FORBIDDEN: pork, alcohol, any non-halal ingredients
   - If religion = "christian" AND isFasting = true:
     - STRICTLY FORBIDDEN: ALL animal products(meat, chicken, fish, eggs, dairy, cheese, milk, butter)
     - Meals MUST be 100% plant-based(vegan)

4. FOOD QUALITY:
   - Use realistic, culturally neutral meals
   - Prefer whole foods over processed foods
   - Avoid repeating the same meal more than twice in the week

5. STRUCTURE:
   - EXACTLY ${totalItemsPerDay} items per day × 7 days = ${totalItemsPerDay * 7} total items
   - ${mealsCount} meals + ${snacksCount} snacks per day
   - Meal times (approximate):
     - Breakfast → "08:00 AM"
     - Lunch → "12:30 PM"
     - Dinner → "07:00 PM"
     ${snacksCount > 0 ? `- Snacks → "10:30 AM", "03:30 PM" (distribute snacks across day)` : ""}
   - Each item MUST include: "mealType": "meal" for meals, "mealType": "snack" for snacks

6. INGREDIENT EFFICIENCY (CRITICAL FOR PERFORMANCE):
   - ONLY include substantial ingredients with meaningful nutritional value
   - EXCLUDE negligible items: salt, pepper, individual spices/herbs, cooking oil, vinegar, baking powder/soda, garlic, small amounts of garnishes
   - Keep ingredient lists concise (4-8 per meal, 1-3 per snack)
   - This reduces response size and improves latency

7. RECOVERY / DIGESTION BALANCE:
   - Distribute heavy vs light meals properly
   - Avoid overly heavy dinners for weight loss goal

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
): Promise<MealPlanResponse> => {
  const prompt = generateMealPlanPrompt(user, mealsCount, snacksCount, favoriteFoods);

  return callLLMWithRecovery(prompt, mealPlanResponseSchema);
};

export const generateWorkoutPlan = async (
  user: UserContext,
  equipment: string[] = [],
  duration: number = 60,
): Promise<WorkoutPlanResponse> => {
  const prompt = generateWorkoutPlanPrompt(
    user,
    user?.trainingDays || 3,
    equipment,
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

Meal:
${JSON.stringify(currentMeal)}

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

ORIGINAL MEAL:
${JSON.stringify(meal, null, 2)}
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

const callOpenRouter = async (prompt: string) => {
  console.log("LLM Prompt:", prompt);

  const completion = await openrouter.chat.completions.create({
    model: "qwen/qwen3-vl-32b-instruct",
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
