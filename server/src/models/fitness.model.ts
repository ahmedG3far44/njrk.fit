import mongoose, { Schema, Document, Types } from 'mongoose';

interface IExercise {
  name: string;
  sets: number;
  reps: string;
  durationMin?: number;
  isCompleted?: boolean;
  exerciseId?: string; 
  gifUrl?: string;
}

interface IWorkoutSession {
  _id?: Types.ObjectId;
  dayOfWeek: string;
  date: Date;
  type: 'Strength' | 'Cardio' | 'Yoga' | 'Mixed' | 'Recovery';
  name: string;
  durationMin: number;
  estimatedCaloriesBurn: number;
  isCompleted: boolean;
  completedAt?: Date;
  exercises: IExercise[];
}

export interface IWeeklyFitnessPlan extends Document {
  userId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  sessionsCompleted: number;
  sessions: IWorkoutSession[];
}

const ExerciseSchema = new Schema<IExercise>({
  name: { type: String, required: true },
  sets: { type: Number },
  reps: { type: String },
  durationMin: { type: Number },
  isCompleted: { type: Boolean, default: false },
  exerciseId: { type: String }, 
  gifUrl: { type: String },
});

const WorkoutSessionSchema = new Schema<IWorkoutSession>({
  dayOfWeek: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now() },
  type: { type: String, enum: ['Strength', 'Cardio', 'Yoga', 'Mixed', 'Recovery'], required: true },
  name: { type: String, required: true },
  durationMin: { type: Number, required: true },
  estimatedCaloriesBurn: { type: Number },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  exercises: [ExerciseSchema],
});

const WeeklyFitnessPlanSchema = new Schema<IWeeklyFitnessPlan>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  sessionsCompleted: { type: Number, default: 0 },
  sessions: [WorkoutSessionSchema],
}, { timestamps: true });

export default mongoose.model<IWeeklyFitnessPlan>('WeeklyFitnessPlan', WeeklyFitnessPlanSchema);