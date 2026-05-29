import { Router, Request, Response, NextFunction } from "express";
import { AuthRequest, authMiddleware } from "../middlewares/authMiddleware";
import mongoose from "mongoose";
import NutritionPlan from "../models/nutrition.model";
import GroceryList from "../models/groceryList.model";
// import ShareList from "../models/sharedList.model";
import User from "../models/user.model";
import { generatePDF } from "../services/pdf.service";
import {
  parseAndAggregateIngredients,
  formatQuantity,
} from "../utils/unitConverter";
import { Meal } from "../types";
// import { uuidv4 } from "zod";

const router = Router();

type GroceryCategory =
  | "Proteins"
  | "Vegetables"
  | "Dairy"
  | "Grains"
  | "Fruits"
  | "Spices"
  | "Other";

interface NormalizedIngredient {
  name: string;
  quantity: number;
  unit: string;
  checked?: boolean;
}

interface AggregatedItem {
  name: string;
  category: GroceryCategory;
  totalQuantity: number;
  unit: string;
  isPurchased: boolean;
}

const CATEGORIES: GroceryCategory[] = [
  "Proteins",
  "Vegetables",
  "Dairy",
  "Grains",
  "Fruits",
  "Spices",
  "Other",
];

// ─────────────────────────────────────────────────────────────────────────────
// Category keyword map
// Each category holds lowercase keywords. An ingredient name is matched against
// each list in CATEGORIES priority order; first match wins. Falls back to "Other".
// Extend these lists freely — the categorizeIngredient() logic never needs to change.
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<GroceryCategory, string[]> = {
  Proteins: [
    "chicken",
    "beef",
    "lamb",
    "turkey",
    "pork",
    "fish",
    "salmon",
    "tuna",
    "shrimp",
    "prawn",
    "egg",
    "eggs",
    "tofu",
    "tempeh",
    "lentil",
    "lentils",
    "chickpea",
    "chickpeas",
    "black bean",
    "kidney bean",
    "protein powder",
    "whey",
    "steak",
    "mince",
    "ground beef",
    "ground turkey",
    "cod",
    "tilapia",
    "sardine",
    "anchovy",
    "duck",
    "veal",
    "bacon",
    "ham",
    "sausage",
  ],
  Vegetables: [
    "spinach",
    "kale",
    "broccoli",
    "carrot",
    "carrots",
    "onion",
    "onions",
    "garlic",
    "tomato",
    "tomatoes",
    "pepper",
    "peppers",
    "zucchini",
    "cucumber",
    "lettuce",
    "celery",
    "cauliflower",
    "cabbage",
    "asparagus",
    "eggplant",
    "aubergine",
    "mushroom",
    "mushrooms",
    "leek",
    "beet",
    "beetroot",
    "sweet potato",
    "potato",
    "potatoes",
    "pumpkin",
    "squash",
    "artichoke",
    "arugula",
    "bok choy",
    "brussels sprout",
    "chard",
    "chive",
    "corn",
    "endive",
    "fennel",
    "green bean",
    "jalapeno",
    "okra",
    "parsnip",
    "radish",
    "turnip",
    "watercress",
    "yam",
    "pea",
    "peas",
  ],
  Dairy: [
    "milk",
    "cheese",
    "butter",
    "cream",
    "yogurt",
    "yoghurt",
    "ghee",
    "cottage cheese",
    "ricotta",
    "mozzarella",
    "cheddar",
    "parmesan",
    "brie",
    "feta",
    "gouda",
    "sour cream",
    "half and half",
    "whipped cream",
    "kefir",
    "quark",
    "mascarpone",
    "cream cheese",
  ],
  Grains: [
    "rice",
    "pasta",
    "bread",
    "oat",
    "oats",
    "flour",
    "wheat",
    "barley",
    "quinoa",
    "bulgur",
    "couscous",
    "cornmeal",
    "polenta",
    "noodle",
    "noodles",
    "tortilla",
    "wrap",
    "pita",
    "rye",
    "spelt",
    "millet",
    "buckwheat",
    "semolina",
    "cereal",
    "granola",
    "cracker",
    "bagel",
    "baguette",
    "sourdough",
    "pancake mix",
  ],
  Fruits: [
    "apple",
    "banana",
    "orange",
    "grape",
    "grapes",
    "strawberry",
    "strawberries",
    "blueberry",
    "blueberries",
    "raspberry",
    "raspberries",
    "mango",
    "pineapple",
    "watermelon",
    "melon",
    "peach",
    "pear",
    "plum",
    "cherry",
    "cherries",
    "kiwi",
    "lemon",
    "lime",
    "avocado",
    "papaya",
    "fig",
    "date",
    "dates",
    "apricot",
    "nectarine",
    "pomegranate",
    "coconut",
    "passion fruit",
    "dragon fruit",
    "guava",
    "lychee",
  ],
  Spices: [
    "salt",
    "pepper",
    "cumin",
    "coriander",
    "turmeric",
    "paprika",
    "cinnamon",
    "oregano",
    "basil",
    "thyme",
    "rosemary",
    "ginger",
    "chili",
    "chilli",
    "cayenne",
    "cardamom",
    "clove",
    "cloves",
    "nutmeg",
    "bay leaf",
    "bay leaves",
    "dill",
    "parsley",
    "sage",
    "tarragon",
    "saffron",
    "star anise",
    "allspice",
    "fennel seed",
    "mustard seed",
    "fenugreek",
    "sumac",
    "curry powder",
    "garam masala",
    "vanilla",
    "anise",
  ],
  Other: [], // fallback — no keywords needed
};


// ─────────────────────────────────────────────────────────────────────────────
// Helper: categorizeIngredient
//
// Matches an ingredient name against CATEGORY_KEYWORDS in priority order.
// Uses substring matching so "chicken breast" correctly maps to Proteins.
// Falls back to "Other" when no keyword matches.
// ─────────────────────────────────────────────────────────────────────────────

function categorizeIngredient(name: string): GroceryCategory {
  const lower = name.toLowerCase().trim();

  for (const category of CATEGORIES) {
    if (category === "Other") continue;
    const matched = CATEGORY_KEYWORDS[category].some((kw) =>
      lower.includes(kw),
    );
    if (matched) return category;
  }

  return "Other";
}

// ─────────────────────────────────────────────────────────────────────────────
// Smart Grocery Sync Helpers & Lookups
// ─────────────────────────────────────────────────────────────────────────────

interface MacroProfile {
  protein: number;
  carbs: number;
  fat: number;
}

const INGREDIENT_MACROS: Record<string, MacroProfile> = {
  // Proteins
  chicken: { protein: 31, carbs: 0, fat: 3.6 },
  beef: { protein: 26, carbs: 0, fat: 15 },
  lamb: { protein: 25, carbs: 0, fat: 21 },
  turkey: { protein: 29, carbs: 0, fat: 7 },
  pork: { protein: 27, carbs: 0, fat: 14 },
  salmon: { protein: 20, carbs: 0, fat: 13 },
  tuna: { protein: 28, carbs: 0, fat: 1 },
  shrimp: { protein: 24, carbs: 0.2, fat: 0.3 },
  prawn: { protein: 24, carbs: 0.2, fat: 0.3 },
  egg: { protein: 13, carbs: 1.1, fat: 11 },
  eggs: { protein: 13, carbs: 1.1, fat: 11 },
  tofu: { protein: 8, carbs: 2, fat: 4.8 },
  tempeh: { protein: 19, carbs: 9, fat: 11 },
  steak: { protein: 25, carbs: 0, fat: 15 },
  cod: { protein: 20, carbs: 0, fat: 0.7 },
  tilapia: { protein: 20, carbs: 0, fat: 1.7 },
  sardine: { protein: 25, carbs: 0, fat: 11 },
  duck: { protein: 19, carbs: 0, fat: 14 },
  veal: { protein: 24, carbs: 0, fat: 9 },
  bacon: { protein: 37, carbs: 1.4, fat: 42 },
  ham: { protein: 21, carbs: 1.5, fat: 6 },
  sausage: { protein: 12, carbs: 1.5, fat: 27 },
  protein_powder: { protein: 80, carbs: 5, fat: 3 },
  whey: { protein: 80, carbs: 5, fat: 3 },

  // Dairy
  milk: { protein: 3.4, carbs: 4.8, fat: 3.25 },
  cheese: { protein: 25, carbs: 1.3, fat: 33 },
  butter: { protein: 0.9, carbs: 0.1, fat: 81 },
  ghee: { protein: 0.3, carbs: 0, fat: 99.5 },
  cream: { protein: 2.7, carbs: 2.7, fat: 36 },
  yogurt: { protein: 10, carbs: 3.6, fat: 0.4 },
  yoghurt: { protein: 10, carbs: 3.6, fat: 0.4 },
  cottage_cheese: { protein: 11, carbs: 3.4, fat: 4.3 },
  ricotta: { protein: 11, carbs: 3, fat: 13 },
  mozzarella: { protein: 22, carbs: 2.2, fat: 22 },
  cheddar: { protein: 25, carbs: 1.3, fat: 33 },
  parmesan: { protein: 38, carbs: 4.1, fat: 29 },
  feta: { protein: 14, carbs: 4, fat: 21 },
  sour_cream: { protein: 2.4, carbs: 4.6, fat: 19.3 },
  cream_cheese: { protein: 6, carbs: 4, fat: 34 },

  // Grains
  rice: { protein: 2.7, carbs: 28, fat: 0.3 },
  pasta: { protein: 5, carbs: 30, fat: 0.9 },
  bread: { protein: 9, carbs: 49, fat: 3.2 },
  oat: { protein: 16.9, carbs: 66, fat: 6.9 },
  oats: { protein: 16.9, carbs: 66, fat: 6.9 },
  flour: { protein: 10, carbs: 76, fat: 1 },
  quinoa: { protein: 4.4, carbs: 21.3, fat: 1.9 },
  barley: { protein: 12, carbs: 73, fat: 2.3 },
  bulgur: { protein: 12, carbs: 76, fat: 1.3 },
  couscous: { protein: 12, carbs: 77, fat: 0.6 },
  tortilla: { protein: 8, carbs: 46, fat: 8 },
  wrap: { protein: 8, carbs: 46, fat: 8 },
  pita: { protein: 9, carbs: 55, fat: 1.2 },
  cereal: { protein: 8, carbs: 80, fat: 3 },
  granola: { protein: 10, carbs: 64, fat: 20 },

  // Fruits
  apple: { protein: 0.3, carbs: 14, fat: 0.2 },
  banana: { protein: 1.1, carbs: 23, fat: 0.3 },
  orange: { protein: 0.9, carbs: 12, fat: 0.1 },
  grape: { protein: 0.7, carbs: 18, fat: 0.2 },
  grapes: { protein: 0.7, carbs: 18, fat: 0.2 },
  strawberry: { protein: 0.7, carbs: 8, fat: 0.3 },
  strawberries: { protein: 0.7, carbs: 8, fat: 0.3 },
  blueberry: { protein: 0.7, carbs: 14, fat: 0.3 },
  blueberries: { protein: 0.7, carbs: 14, fat: 0.3 },
  mango: { protein: 0.8, carbs: 15, fat: 0.4 },
  pineapple: { protein: 0.5, carbs: 13, fat: 0.1 },
  avocado: { protein: 2, carbs: 8.5, fat: 15 },
  coconut: { protein: 3.3, carbs: 15, fat: 33 },

  // Vegetables
  spinach: { protein: 2.9, carbs: 3.6, fat: 0.4 },
  kale: { protein: 4.3, carbs: 8.8, fat: 0.9 },
  broccoli: { protein: 2.8, carbs: 7, fat: 0.4 },
  carrot: { protein: 0.9, carbs: 9.6, fat: 0.2 },
  carrots: { protein: 0.9, carbs: 9.6, fat: 0.2 },
  onion: { protein: 1.1, carbs: 9.3, fat: 0.1 },
  onions: { protein: 1.1, carbs: 9.3, fat: 0.1 },
  garlic: { protein: 6.4, carbs: 33, fat: 0.5 },
  tomato: { protein: 0.9, carbs: 3.9, fat: 0.2 },
  tomatoes: { protein: 0.9, carbs: 3.9, fat: 0.2 },
  potato: { protein: 2, carbs: 17, fat: 0.1 },
  potatoes: { protein: 2, carbs: 17, fat: 0.1 },
  sweet_potato: { protein: 1.6, carbs: 20, fat: 0.1 },
  sweet_potatoes: { protein: 1.6, carbs: 20, fat: 0.1 },
};

function normalizeIngredientName(name: string): string {
  let lower = name.toLowerCase().trim();

  // Strip leading numbers and units/pieces e.g. "3 " or "200g " or "2 piece "
  lower = lower.replace(/^[\d\.\/\s-\x2D]+(?:g|kg|oz|lb|ml|l|cup|tbsp|tsp|piece|pieces|pcs|dozen)?\s+/i, "");

  // Remove common cooking / preparation adjectives
  const adjectives = [
    "boiled", "boilded", "scrambled", "omelet", "omlet", "fried", "poached", "baked",
    "roasted", "grilled", "steamed", "cooked", "raw", "fresh", "sliced", "chopped",
    "diced", "minced", "grated", "mashed", "pureed", "peeled", "dried", "frozen",
    "organic", "large", "medium", "small", "whole", "shredded", "canned"
  ];

  // Regex to remove the adjectives as whole words
  const adjRegex = new RegExp(`\\b(${adjectives.join("|")})\\b`, "gi");
  lower = lower.replace(adjRegex, "").replace(/\s+/g, " ").trim();

  // Standardize plurals to singular for common foods
  const pluralPairs: [RegExp, string][] = [
    [/\beggs\b/g, "egg"],
    [/\btomatoes\b/g, "tomato"],
    [/\bpotatoes\b/g, "potato"],
    [/\bcarrots\b/g, "carrot"],
    [/\bapples\b/g, "apple"],
    [/\bbananas\b/g, "banana"],
    [/\bonions\b/g, "onion"],
    [/\bpeppers\b/g, "pepper"],
    [/\bmushrooms\b/g, "mushroom"],
    [/\bpeaches\b/g, "peach"],
    [/\bpears\b/g, "pear"],
    [/\bplums\b/g, "plum"],
    [/\bcherries\b/g, "cherry"],
    [/\bkiwis\b/g, "kiwi"],
    [/\blemons\b/g, "lemon"],
    [/\blimes\b/g, "lime"],
    [/\bavocados\b/g, "avocado"],
    [/\bdates\b/g, "date"],
    [/\bapricots\b/g, "apricot"],
    [/\bcloves\b/g, "clove"],
    [/\bleaves\b/g, "leaf"],
    [/\bpeas\b/g, "pea"],
  ];

  for (const [pluralRegex, singular] of pluralPairs) {
    lower = lower.replace(pluralRegex, singular);
  }

  if (lower.endsWith("s")) {
    const commonSingulars = ["breast", "thigh", "wing", "fillet", "steak", "bean", "lentil", "berry", "strawberry", "blueberry", "raspberry", "grape"];
    for (const item of commonSingulars) {
      if (lower.endsWith(item + "s")) {
        lower = lower.slice(0, -1);
      }
    }
  }

  return lower.trim();
}

function capitalizeWords(str: string): string {
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getMacrosForIngredient(name: string): MacroProfile | null {
  const lower = name.toLowerCase().trim().replace(/\s+/g, "_");

  // 1. Direct match
  if (INGREDIENT_MACROS[lower]) {
    return INGREDIENT_MACROS[lower];
  }

  // 2. Substring match
  for (const [key, macros] of Object.entries(INGREDIENT_MACROS)) {
    if (lower.includes(key) || key.includes(lower)) {
      return macros;
    }
  }

  // 3. Fallback profiles based on original keywords
  for (const category of CATEGORIES) {
    if (category === "Other" || category === "Spices") continue;
    const matched = CATEGORY_KEYWORDS[category].some((kw) =>
      lower.includes(kw.replace(/\s+/g, "_")),
    );
    if (matched) {
      switch (category) {
        case "Proteins":
          return { protein: 25, carbs: 0, fat: 5 };
        case "Dairy":
          return { protein: 10, carbs: 4, fat: 15 };
        case "Grains":
          return { protein: 8, carbs: 60, fat: 2 };
        case "Fruits":
          return { protein: 1, carbs: 15, fat: 0.2 };
        case "Vegetables":
          return { protein: 2, carbs: 6, fat: 0.2 };
      }
    }
  }

  return null;
}

function categorizeIngredientByMacros(name: string): GroceryCategory {
  const normalized = normalizeIngredientName(name);
  const macros = getMacrosForIngredient(normalized);

  if (macros) {
    const { protein, carbs, fat } = macros;

    // Rule 1: Protein > Carbs & Fats
    if (protein > carbs && protein > fat) {
      return "Proteins";
    }

    // Rule 2: Carbs > Protein & Fats
    if (carbs > protein && carbs > fat) {
      const lower = normalized.toLowerCase();
      for (const cat of ["Grains", "Fruits", "Vegetables"] as GroceryCategory[]) {
        if (CATEGORY_KEYWORDS[cat].some((kw) => lower.includes(kw))) {
          return cat;
        }
      }
      return "Grains";
    }

    // Rule 3: Fats > others
    if (fat > protein && fat > carbs) {
      const lower = normalized.toLowerCase();
      if (
        CATEGORY_KEYWORDS["Dairy"].some((kw) => lower.includes(kw)) ||
        lower.includes("cheese") ||
        lower.includes("butter") ||
        lower.includes("milk") ||
        lower.includes("cream")
      ) {
        return "Dairy";
      }
      // If not dairy, check if matches other category list
      for (const cat of ["Fruits", "Vegetables", "Proteins", "Grains"] as GroceryCategory[]) {
        if (CATEGORY_KEYWORDS[cat].some((kw) => lower.includes(kw))) {
          return cat;
        }
      }
      return "Other";
    }
  }

  return categorizeIngredient(name);
}

function getUniqueDaysInPlan(plan: any): number {
  const days = new Set<string>();
  for (const meal of plan.meals || []) {
    if (meal.day) {
      days.add(String(meal.day).trim().toLowerCase());
    }
  }
  return days.size || 7;
}

function getAggregatedIngredientsForPlan(plan: any): Array<{
  normalizedName: string;
  unit: string;
  quantity: number;
}> {
  const map = new Map<string, { normalizedName: string; unit: string; quantity: number }>();
  for (const meal of plan.meals || []) {
    for (const ingredient of meal.ingredients || []) {
      const ing = ingredient as any;
      let name = "";
      let quantity = 1;
      let unit = "g";

      if (typeof ing === "string") {
        const match = ing.match(/^([\d.\/\s]+)?\s*(.+)$/);
        if (match) {
          name = match[2]?.trim() || ing;
          quantity = parseFloat(match[1]?.trim()) || 1;
        } else {
          name = ing;
        }
      } else if (ing && typeof ing === "object" && ing.name) {
        name = String(ing.name).trim();
        quantity = Number(ing.quantity) || 1;
        unit = String(ing.unit ?? "g").trim().toLowerCase();
      }

      if (!name || quantity <= 0) continue;

      const normName = normalizeIngredientName(name);
      const key = `${normName}|${unit}`;

      if (map.has(key)) {
        map.get(key)!.quantity += quantity;
      } else {
        map.set(key, { normalizedName: normName, unit, quantity });
      }
    }
  }
  return Array.from(map.values());
}

function toResponseItem(item: {
  name: string;
  category: string;
  totalQuantity: number;
  unit: string;
  isPurchased: boolean;
}) {
  return {
    name: item.name,
    category: item.category,
    quantity: formatQuantity(item.totalQuantity, item.unit),
    checked: item.isPurchased,
    isPurchased: item.isPurchased,
  };
}

router.get(
  "/",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.userId;

      let groceryList = await GroceryList.findOne({ userId });

      if (!groceryList) {
        groceryList = await GroceryList.create({ userId, items: [] });
      }

      const items = groceryList.items.map((item) =>
        toResponseItem({
          name: item.name,
          category: item.category,
          totalQuantity: Number(item.totalQuantity),
          unit: item.unit,
          isPurchased: item.isPurchased,
        }),
      );

      res.status(200).json({
        items,
        purchasedCount: items.filter((i) => i.checked).length,
        totalCount: items.length,
        categories: CATEGORIES,
      });
    } catch (error) {
      next(error);
    }
  },
);

// ─────────────────────────────────────────────
// POST /grocery-list/sync
// Rebuilds the grocery list from nutrition plans for the given date window.
// ─────────────────────────────────────────────
router.post(
  "/sync",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.userId;

      const daysAhead = Math.max(1, parseInt(req.body.duration as string) || 7);
      const isFamily: boolean =
        req.body.isFamily === true || req.body.isFamily === "true";

      // ── Step 1: Validate user ──────────────────────────────────────────────
      const user = await User.findById(userId).lean();
      if (!user) {
        res.status(404).json({ error: "User not found." });
        return;
      }

      // ── Step 2: Resolve all user IDs to aggregate for ─────────────────────
      const userIds: mongoose.Types.ObjectId[] = [
        new mongoose.Types.ObjectId(userId),
      ];

      if (isFamily) {
        const familyMembers: mongoose.Types.ObjectId[] =
          (user.familyMembers as mongoose.Types.ObjectId[]) ?? [];

        if (!familyMembers.length) {
          console.info(
            `[sync] User ${userId} requested family sync but has no family members. Syncing solo.`,
          );
        } else {
          for (const memberId of familyMembers) {
            userIds.push(new mongoose.Types.ObjectId(memberId.toString()));
          }
          console.info(
            `[sync] Syncing for user + ${familyMembers.length} family member(s). Total IDs: ${userIds.length}`,
          );
        }
      }

      // ── Step 3: Fetch latest nutrition plan per user ──────────────────────
      const planDocs = await Promise.all(
        userIds.map(id => NutritionPlan.findOne({ userId: id }).sort({ date: -1 })),
      );
      const plans = planDocs.filter((p): p is NonNullable<typeof p> => p != null);

      if (!plans.length) {
        res.status(404).json({
          error: "No nutrition plans found for the specified users.",
        });
        return;
      }

      console.info(
        `[sync] Found ${plans.length} nutrition plan(s) across ${userIds.length} user(s).`,
      );

      // ── Step 4: Average and Scale quantities per plan ──────────────────────
      interface AggregatedGlobalItem {
        name: string;
        category: GroceryCategory;
        totalQuantity: number;
        unit: string;
      }

      const globalMap = new Map<string, AggregatedGlobalItem>();

      for (const plan of plans) {
        const planDays = getUniqueDaysInPlan(plan);
        const planIngredients = getAggregatedIngredientsForPlan(plan);

        for (const ing of planIngredients) {
          const dailyAvg = ing.quantity / planDays;
          const scaledQty = dailyAvg * daysAhead;

          const key = `${ing.normalizedName}|${ing.unit}`;
          if (globalMap.has(key)) {
            globalMap.get(key)!.totalQuantity += scaledQty;
          } else {
            globalMap.set(key, {
              name: capitalizeWords(ing.normalizedName),
              category: categorizeIngredientByMacros(ing.normalizedName),
              totalQuantity: scaledQty,
              unit: ing.unit,
            });
          }
        }
      }

      if (!globalMap.size) {
        res.status(422).json({
          error: "Nutrition plans exist but contain no valid ingredients.",
        });
        return;
      }

      console.info(
        `[sync] Aggregated to ${globalMap.size} unique scaled grocery item(s).`,
      );

      // ── Step 5: Preserve isPurchased across all relevant users ─────────────
      const existingLists = await GroceryList.find({
        userId: { $in: userIds },
      });
      const purchasedSet = new Set(
        existingLists
          .flatMap(list => list.items)
          .filter((i) => i.isPurchased)
          .map((i) => normalizeIngredientName(i.name)),
      );

      const newItems = Array.from(globalMap.values()).map((agg) => ({
        name: agg.name,
        category: agg.category,
        totalQuantity: parseFloat(agg.totalQuantity.toFixed(2)),
        unit: agg.unit,
        isPurchased: purchasedSet.has(normalizeIngredientName(agg.name)),
        consumers: userIds,
      }));

      // ── Step 6: Upsert grocery list ────────────────────────────────────────
      await GroceryList.findOneAndUpdate(
        { userId },
        {
          $set: {
            items: newItems,
            lastSyncedAt: new Date(),
            syncedFrom: new Date(),
          },
        },
        { upsert: true, new: true },
      );

      // ── Step 7: Build response ─────────────────────────────────────────────
      const flatItems = newItems.map((item) => ({
        name: item.name,
        category: item.category,
        quantity: formatQuantity(item.totalQuantity, item.unit),
        rawQuantity: item.totalQuantity,
        unit: item.unit,
        checked: item.isPurchased,
      }));

      // Group by category so the frontend can render sections without extra work
      const groupedByCategory = CATEGORIES.reduce(
        (acc, cat) => {
          acc[cat] = flatItems.filter((i) => i.category === cat);
          return acc;
        },
        {} as Record<GroceryCategory, typeof flatItems>,
      );

      res.status(200).json({
        items: flatItems,
        groupedByCategory,
        purchasedCount: flatItems.filter((i) => i.checked).length,
        totalCount: flatItems.length,
        syncedAt: new Date(),
        syncedForDays: daysAhead,
        syncedUsers: userIds.length,
        categories: CATEGORIES,
      });
    } catch (error) {
      next(error);
    }
  },
);
// ─────────────────────────────────────────────
// POST /grocery-list/toggle-item
// Toggles the isPurchased flag for a single item by name.
// ─────────────────────────────────────────────

router.post(
  "/toggle-item",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.userId;
      const { itemName, checked } = req.body;

      if (!itemName || typeof checked !== "boolean") {
        res.status(400).json({
          error: "itemName (string) and checked (boolean) are required.",
        });
        return;
      }

      const normalizedName = (itemName as string).toLowerCase().trim();

      const groceryList = await GroceryList.findOne({ userId });

      if (!groceryList) {
        res.status(404).json({ error: "Grocery list not found." });
        return;
      }

      const item = groceryList.items.find(
        (i) => i.name.toLowerCase() === normalizedName,
      );

      if (!item) {
        res
          .status(404)
          .json({ error: `Item "${itemName}" not found in grocery list.` });
        return;
      }

      item.isPurchased = checked;
      await groceryList.save();

      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/add-item",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.userId;
      const { name, quantity = "1", category = "Other" } = req.body;

      let groceryList = await GroceryList.findOne({ userId });

      if (!groceryList) {
        groceryList = await GroceryList.create({ userId, items: [] });
      }

      const {
        parseAndAggregateIngredients,
      } = require("../utils/unitConverter");
      const parsed = parseAndAggregateIngredients([{ name, quantity }]);
      const agg = parsed[0];

      groceryList.items.push({
        name,
        category: agg.category,
        totalQuantity: agg.totalQuantity,
        unit: agg.unit,
        isPurchased: false,
        consumers: [new mongoose.Types.ObjectId(userId)],
      });

      await groceryList.save();

      res.status(201).json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);


export default router;
