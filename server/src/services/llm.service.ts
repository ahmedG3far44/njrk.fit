import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { env } from '../configs/env';
import {
    calculateBMR,
    calculateTDEE,
    adjustCaloriesForGoal,
    calculateMacros,
    activityMultipliers,
} from '../utils/caloriesCalculations';
import { Meal, UserContext } from '../types';
import { openrouter } from '../configs/llm';
import { normalizeMeal } from '../utils/parser';

export const mealSchema = z.object({
    day: z.string(),
    name: z.string(),
    time: z.string(),
    macros: z.object({
        calories: z.number(),
        protein: z.number(),
        carbs: z.number(),
        fats: z.number(),
    }),

    ingredients: z.array(z.string()),
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
    sessions: z.array(z.object({
        dayOfWeek: z.string(),
        name: z.string(),
        type: z.enum(['Strength', 'Cardio', 'Yoga', 'Mixed', 'Recovery']),
        durationMin: z.number(),
        estimatedCaloriesBurn: z.number(),
        exercises: z.array(z.object({
            name: z.string(),
            sets: z.number(),
            reps: z.string(),
            durationMin: z.number().optional(),
        })),
    })),
});

export type MealPlanResponse = z.infer<typeof mealPlanResponseSchema>;
export type WorkoutPlanResponse = z.infer<typeof workoutPlanResponseSchema>;
export type MealPlanRefineResponse = z.infer<typeof mealSchema>;

// Initialize Gemini client
const gemini = new GoogleGenAI({
    apiKey: env.googleApiKey || '',
});

const generateMealPlanPrompt = (user: UserContext): string => {
    const bmr = calculateBMR(user);
    const tdee = calculateTDEE(user, bmr);
    const dailyCalories = adjustCaloriesForGoal(tdee, user.goal);
    const targetMacros = calculateMacros(dailyCalories, user);

    const { calories, protein, carbs, fats } = targetMacros;
    const activityLevel = user.activityLevel || 'moderate';
    const activityDesc = Object.entries(activityMultipliers)
        .filter(([key]) => key === activityLevel)
        .map(([, val]) => `${val}x basal metabolic rate`)[0] || '1.55x';

    const restrictions = user.dietaryRestrictions?.length
        ? `Dietary restrictions: ${user.dietaryRestrictions.join(', ')}. `
        : '';

    return `
You are a professional nutritionist. Generate a personalized 7-day meal plan.

USER PROFILE:
- Name: ${user.name}
- Target daily calories: ${calories} kcal
- Target macros: Protein ${protein}g, Carbs ${carbs}g, Fats ${fats}g
- Activity level: ${activityLevel} (${activityDesc})
- Goal: ${user?.goal || 'balance_weight'}
- Fitness goals: ${user?.fitnessGoals?.join(', ') || 'general fitness'}

USER DIETARY CONTEXT:
- Allergies: ${user?.allergies?.join(', ') || 'none'}
- Religion: ${user?.religion || 'none'}
- Christian fasting: ${user?.isFasting ?? false}

STRICT RULES (MUST FOLLOW — NO EXCEPTIONS):

1. CALORIES & MACROS:
- Each day MUST total ~${calories} kcal (±50 kcal)
- Each meal ≈ 1/3 of daily macros
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

4. FOOD QUALITY:
- Use realistic, culturally neutral meals
- Prefer whole foods over processed foods
- Avoid repeating the same meal more than twice in the week

5. STRUCTURE:
- EXACTLY 21 meals (3 per day × 7 days)
- Meal times:
  - Breakfast → "08:00 AM"
  - Lunch → "12:30 PM"
  - Dinner → "07:00 PM"

6. RECOVERY / DIGESTION BALANCE:
- Distribute heavy vs light meals properly
- Avoid overly heavy dinners for weight loss goal

OUTPUT FORMAT (STRICT JSON ONLY — NO TEXT):

{
  "meals": [
    {
      "day": "Day 1",
      "name": "Meal name",
      "time": "08:00 AM",
      "macros": {
        "calories": ${Math.round(calories / 3)},
        "protein": ${Math.round(protein / 3)},
        "carbs": ${Math.round(carbs / 3)},
        "fats": ${Math.round(fats / 3)}
      },
      "ingredients": [
        {"name": "ingredient", "quantity": "amount"}
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


const generateWorkoutPlanPrompt = (user: UserContext, training_days: number, equipment: string[], duration: number = 60): string => {
    const equip = equipment?.length > 0 ? equipment.join(', ') : "Gym equipment available for use";
    const activityLevel = user.activityLevel || 'moderate';

    return `
You are a professional fitness coach. Generate a structured weekly workout plan.

USER PROFILE:
- Name: ${user.name}
- Activity level: ${activityLevel}
- Fitness goals: ${user.fitnessGoals?.join(', ') || 'general fitness'}

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

// const callGeminiAPI = async (prompt: string): Promise<string> => {
//     if (!env.googleApiKey) {
//         throw new Error('Google API key not configured');
//     }

//     // Simple config without schema for now
//     const config = {
//         responseMimeType: 'application/json',
//     };

//     const response = await gemini.models.generateContent({
//         model: 'gemini-2.5-flash-lite',
//         contents: [{ role: 'user', parts: [{ text: prompt }] }],
//         config,
//     });

//     const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

//     if (!text) {
//         throw new Error('Empty response from Gemini');
//     }

//     return text;
// };

const safeParse = (text: string): any => {
    try {
        return JSON.parse(text);
    } catch {
        const tryAgain = text.match(/```json([\s\S]*?)```/);
        if (tryAgain) {
            return JSON.parse(tryAgain[1]);
        }
        throw new Error('Invalid JSON from Gemini');
    }
};

// const callOllamaAPI = async (prompt: string): Promise<string> => {

//     console.log("Hitting ollama ")
//     console.log("Ollama API key", env.ollamaApiKey);

//     if (!env.ollamaApiKey) {
//         throw new Error('Ollama API key not configured');
//     }



//     const response = await ollama.chat({
//         model: 'qwen2.5-coder:1.5b',
//         messages: [
//             {
//                 role: 'system',
//                 content: `
// You are a strict JSON API.
// - Return ONLY valid JSON
// - No explanations
// - No repetition
// - No extra text
// - If unsure, return {"error": "unknown"}
// `},
//             { role: 'user', content: prompt }
//         ],
//         stream: false,
//         format: 'json',
//         options: {
//             temperature: 0.2,        // 🔥 reduce randomness
//             top_p: 0.8,              // reduce weird outputs
//             repeat_penalty: 1.2,     // 🚫 stop loops
//             num_predict: 300,        // limit response size
//             num_ctx: 2048,           // keep context small for speed
//             // stop: ["\n\n", "}"]      // 🧠 force early stop
//         }

//     });

//     let text = response.message.content;

//     if (!text) {
//         throw new Error('Empty response from Ollama');
//     }
//     console.log("Ollama response", text);
//     return text;
// };


const callOpenRouter = async (prompt: string) => {
    try {

        console.log("Hitting OpenRouter ");
        const completion = await openrouter.chat.completions.create({
            model: "inclusionai/ling-2.6-1t:free",

            messages: [
                { role: "system", content: "You are a strict JSON API. Return ONLY valid JSON, no explanations, no repetition, no extra text. If unsure, return {error: 'unknown'}" },
                { role: "user", content: prompt }
            ],
        });

        let text = completion.choices[0].message.content;

        if (!text) {
            throw new Error('Empty response from OpenRouter');
        }
        console.log("OpenRouter response", text);
        return text;
    } catch (error) {
        console.log(error)
        return null;
    }
}
export const generateMealPlan = async (user: UserContext): Promise<MealPlanResponse> => {
    try {
        console.log("Generating meal plan for user", user.name);
        const prompt = generateMealPlanPrompt(user);

        const content = await callOpenRouter(prompt);
        console.log("content", content);
        if (!content) {
            throw new Error('Empty response from OpenRouter');
        }
        const parsed = safeParse(content);
        // console.dir(parsed, { depth: null });

        // evaluating matching schema :
        const parsedData = mealPlanResponseSchema.parse(parsed);
        console.dir(parsedData, { depth: null });

        return parsedData;
    } catch (error) {
        console.error('Error generating meal plan:', error);
        throw new Error('Failed to generate meal plan. Check API key and Gemini quota.');
    }
};

export const generateWorkoutPlan = async (
    user: UserContext,
    equipment: string[] = [],
    duration: number = 60
): Promise<WorkoutPlanResponse> => {
    try {
        const prompt = generateWorkoutPlanPrompt(user, duration, equipment, user?.trainingDays || 3);

        // const content = await callOllamaAPI(prompt);

        const content = await callOpenRouter(prompt);

        if (!content) {
            throw new Error('Workout Plan not generated,Empty response from OpenRouter');
        }

        const parsed = safeParse(content);

        // console.dir(parsed, { depth: null });

        // evaluating matching schema :

        const parsedData = workoutPlanResponseSchema.parse(parsed);

        // console.dir(parsedData, { depth: null });

        return parsedData;
    } catch (error) {
        console.error('Error generating workout plan:', error);
        throw new Error('Failed to generate workout plan. Check API key and Gemini quota.');
    }
};

export const refineMeal = async (
    currentMeal: Meal,
    refinementPrompt: string,
    user: UserContext
): Promise<MealPlanRefineResponse> => {
    try {
        const prompt = `
Return ONLY valid JSON.

Schema:
${mealSchema}

Rules:
- Keep same calories exactly
- Keep protein, carbs, fats within ±5%
- Respect dietary Restrictions & allergies
- Do not rename fields or change structure
- No text, no markdown, JSON only

User Context:
${JSON.stringify(user)}

Current Meal:
${JSON.stringify(currentMeal)}

User Refinement Prompt:
"${refinementPrompt}"
`;

        const content = await callOpenRouter(prompt);

        if (!content) {
            throw new Error('Meal Plan not refined,Empty response from OpenRouter');
        }

        const parsed = safeParse(content);


        console.dir(parsed, { depth: null });

        const refinedMeal = mealSchema.parse(normalizeMeal(parsed));

        const newRefinedMeal = refinedMeal as MealPlanRefineResponse;

        console.dir(newRefinedMeal, { depth: null });

        return newRefinedMeal;
    } catch (error) {
        console.error('Error refining meal plan:', error);
        throw new Error('Failed to refine meal plan');
    }
};