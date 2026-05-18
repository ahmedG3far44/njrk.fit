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

const CATEGORY_OVERRIDES: Record<string, GroceryCategory> = {
  "peanut butter": "Other",
  "almond butter": "Other",
  "cashew butter": "Other",
};

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
  const override = CATEGORY_OVERRIDES[lower];
  if (override) return override;

  for (const category of CATEGORIES) {
    if (category === "Other") continue;
    const matched = CATEGORY_KEYWORDS[category]
      .sort((a, b) => b.length - a.length)
      .some((kw) => {
        const escapedKeyword = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`(^|\\W)${escapedKeyword}(\\W|$)`, "i").test(lower);
      });
    if (matched) return category;
  }

  return "Other";
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: extractRawIngredients
//
// Walks plans → meals → ingredients and normalizes every entry into
// { name, quantity, unit }. Handles both object-shaped and legacy string entries.
// ─────────────────────────────────────────────────────────────────────────────

function extractRawIngredients(
  plans: Awaited<ReturnType<typeof NutritionPlan.find>>,
): NormalizedIngredient[] {
  const result: NormalizedIngredient[] = [];

  for (const plan of plans) {
    for (const meal of plan.meals || []) {
      for (const ingredient of meal.ingredients || []) {
        const ing = ingredient as any;

        if (typeof ing === "string") {
          // Legacy string e.g. "200 chicken breast"
          const match = ing.match(/^([\d.\/\s]+)?\s*(.+)$/);
          if (match) {
            result.push({
              name: match[2]?.trim() || ing,
              quantity: parseFloat(match[1]?.trim()) || 1,
              unit: "g",
            });
          }
        } else if (ing && typeof ing === "object" && ing.name) {
          result.push({
            name: String(ing.name).trim(),
            quantity: Number(ing.quantity) || 1,
            unit: String(ing.unit ?? "g").trim(), // preserve actual unit
          });
        } else {
          console.warn(
            `[sync] Unrecognized ingredient shape: ${JSON.stringify(ing)}`,
          );
        }
      }
    }
  }

  return result;
}

function aggregateIngredients(
  rawIngredients: NormalizedIngredient[],
  daysAhead: number,
): AggregatedItem[] {
  const scaleFactor = daysAhead > 7 ? daysAhead / 7 : 1;
  // Map key: "normalizedName|unit" ensures duplicates are merged correctly
  const map = new Map<string, AggregatedItem>();

  for (const ing of rawIngredients) {
    const name = ing.name.trim();
    const unit = (ing.unit || "g").trim().toLowerCase();
    const quantity = Number(ing.quantity) || 0;

    if (!name || quantity <= 0) {
      console.warn(
        `[sync] Skipping invalid ingredient: ${JSON.stringify(ing)}`,
      );
      continue;
    }

    const key = `${name.toLowerCase()}|${unit}`;

    if (map.has(key)) {
      // Accumulate quantity for duplicate entries
      map.get(key)!.totalQuantity += quantity;
    } else {
      map.set(key, {
        name,
        category: categorizeIngredient(name),
        totalQuantity: quantity,
        unit,
        isPurchased: false,
      });
    }
  }

  // Meal plans are already weekly. Keep 7-day sync unscaled; scale longer windows.
  return Array.from(map.values()).map((item) => ({
    ...item,
    totalQuantity: parseFloat((item.totalQuantity * scaleFactor).toFixed(2)),
  }));
}

function toResponseItem(
  item: {
    name: string;
    category: string;
    totalQuantity: number;
    unit: string;
    isPurchased: boolean;
  },
) {

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

      // FIX #2 — daysAhead is used only for display scaling, not for DB filtering here.
      // Fetch (or lazily create) the stored grocery list — no mutations.
      let groceryList = await GroceryList.findOne({ userId });

      if (!groceryList) {
        groceryList = await GroceryList.create({ userId, items: [] });
      }

      // FIX #3 — Build the response from what's already in the DB.
      // If the list is empty the caller should trigger POST /sync first.
      const items = groceryList.items.map((item) =>
        toResponseItem(
          {
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

      // ── Step 3: Fetch all nutrition plans for resolved user IDs ────────────
      const plans = await NutritionPlan.find({
        userId: { $in: userIds },
      });

      if (!plans.length) {
        res.status(404).json({
          error: "No nutrition plans found for the specified users.",
        });
        return;
      }

      console.info(
        `[sync] Found ${plans.length} nutrition plan(s) across ${userIds.length} user(s).`,
      );

      // ── Step 4: Extract raw ingredients ───────────────────────────────────
      const rawIngredients = extractRawIngredients(plans);

      if (!rawIngredients.length) {
        res.status(422).json({
          error: "Nutrition plans exist but contain no valid ingredients.",
        });
        return;
      }

      console.info(
        `[sync] Extracted ${rawIngredients.length} raw ingredient entries.`,
      );

      // ── Step 5: Aggregate, categorize, and scale by daysAhead ─────────────
      const aggregated = aggregateIngredients(rawIngredients, daysAhead);

      console.info(
        `[sync] Aggregated to ${aggregated.length} unique grocery item(s).`,
      );

      // ── Step 6: Preserve isPurchased state from existing list ──────────────
      const existingList = await GroceryList.findOne({ userId });
      const purchasedSet = new Set(
        existingList?.items
          .filter((i) => i.isPurchased)
          .map((i) => i.name.toLowerCase()) ?? [],
      );

      const newItems = aggregated.map((agg) => ({
        name: agg.name,
        category: agg.category,
        totalQuantity: agg.totalQuantity, // already scaled × daysAhead
        unit: agg.unit,
        isPurchased: purchasedSet.has(agg.name.toLowerCase()),
        consumers: userIds,
      }));

      // ── Step 7: Upsert grocery list ────────────────────────────────────────
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

      // ── Step 8: Build response ─────────────────────────────────────────────
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

// router.post(
//   "/share",
//   authMiddleware,
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const authReq = req as AuthRequest;
//       const userId = authReq.user?.userId;

//       const groceryList = await GroceryList.findOne({ userId });

//       if (!groceryList) {
//         return res.status(404).json({ error: "No grocery list found" });
//       }

//       const token = uuidv4();
//       const expiresAt = new Date();
//       expiresAt.setDate(expiresAt.getDate() + 7);

//       const sharedList = await SharedList.create({
//         token,
//         userId,
//         items: groceryList.items.map((item) => ({
//           name: item.name,
//           category: item.category,
//           quantity: formatQuantity(item.totalQuantity, item.unit),
//           isPurchased: item.isPurchased,
//         })),
//         expiresAt,
//       });

//       res.status(201).json({
//         success: true,
//         shareUrl: `/shared-list/${token}`,
//       });
//     } catch (error) {
//       next(error);
//     }
//   },
// );

// router.get(
//   "/shared/:token",
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const { token } = req.params;

//       const sharedList = await SharedList.findOne({ token });

//       if (!sharedList) {
//         return res.status(404).json({ error: "List not found or expired" });
//       }

//       if (new Date() > sharedList.expiresAt) {
//         return res.status(410).json({ error: "Link has expired" });
//       }

//       res.status(200).json({
//         items: sharedList.items,
//         expiresAt: sharedList.expiresAt,
//       });
//     } catch (error) {
//       next(error);
//     }
//   },
// );

router.get(
  "/export/pdf",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthRequest).user?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const [user, groceryList] = await Promise.all([
        User.findById(userId),
        GroceryList.findOne({ userId }),
      ]);

      if (!user) return res.status(404).json({ message: "User not found" });
      if (!groceryList || groceryList.items.length === 0)
        return res.status(400).json({ message: "Grocery list is empty, sync from your meal plan first" });

      const pdfBuffer = await generatePDF("grocery", groceryList, user);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="grocery-list.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
