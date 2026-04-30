import mongoose, { Schema, Document, Types } from 'mongoose';

interface IMacros {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface IMeal {
  day: string;
  name: string;
  time: string;
  macros: IMacros;
  ingredients: { name: string; quantity: string }[];
  instructions: string[];
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
  macros: {
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fats: { type: Number, required: true },
  },
  ingredients: [{
    name: { type: String, required: true },
    quantity: { type: String, required: true }
  }],
  instructions: [{ type: String }],
});

const NutritionPlanSchema = new Schema<INutritionPlan>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, required: true },
  targetMacros: {
    calories: { type: Number },
    protein: { type: Number },
    carbs: { type: Number },
    fats: { type: Number },
  },
  meals: [MealSchema],
}, { timestamps: true });

// Prevent duplicate plans for the same user on the same day
NutritionPlanSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<INutritionPlan>('NutritionPlan', NutritionPlanSchema);