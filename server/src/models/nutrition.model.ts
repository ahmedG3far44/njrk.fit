import mongoose, { Schema, Document, Types } from "mongoose";

interface IMacros {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface IMeal {
  _id?: Types.ObjectId;
  day: string;
  name: string;
  time: string;
  mealType: 'meal' | 'snack';
  macros: IMacros;
  ingredients: { name: string; quantity: number; unit?: string }[];
  instructions: string[];
  isCompleted?: boolean;
}

export interface INutritionPlan extends Document {
  userId: Types.ObjectId;
  date: Date;
  targetMacros: IMacros;
  meals: IMeal[];
}

const MealSchema = new Schema<IMeal>({
  day: { type: String, required: true },
  name: { type: String, required: true },
  time: { type: String, required: true },
  mealType: { type: String, enum: ['meal', 'snack'], default: 'meal' },
  macros: {
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fats: { type: Number, required: true },
  },
  ingredients: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      unit: { type: String },
    },
  ],
  instructions: [{ type: String }],
  isCompleted: { type: Boolean, default: false },
});

const NutritionPlanSchema = new Schema<INutritionPlan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: { type: Date, required: true },
    targetMacros: {
      calories: { type: Number },
      protein: { type: Number },
      carbs: { type: Number },
      fats: { type: Number },
    },
    meals: [MealSchema],
  },
  { timestamps: true },
);

// Prevent duplicate plans for the same user on the same day
NutritionPlanSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<INutritionPlan>(
  "NutritionPlan",
  NutritionPlanSchema,
);
