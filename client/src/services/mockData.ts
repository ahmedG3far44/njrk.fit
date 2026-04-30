export const USE_MOCK = false

export interface User {
  _id: string
  email: string
  name: string
  avatarUrl?: string
  height?: number
  weight?: number
  age?: number
  gender?: 'male' | 'female'
  goal?: string
  activityLevel?: string
  fitnessGoals?: string[]
  dietaryRestrictions?: string[]
  equipment?: string[]
  subscription?: { planId: string; status: string; currentPeriodEnd?: Date }
  subscriptionTier?: string
  currentStreak?: number
  longestStreak?: number
  availableFreezes?: number
  totalPoints?: number
  preferences?: {
    notifications: boolean
    weeklySummary: boolean
    mealReminders: boolean
    autoGenerateMeals?: boolean
    reminderTime?: string
    reminderTypes?: string[]
  }
  medicalCondition?: string
  allergies?: string[]
  isOnboarded: boolean
  onboardingProgress?: OnboardingProgress
}

export interface OnboardingProgress {
  step1?: {
    age?: number
    gender?: string
    height?: number
    weight?: number
  }
  step2?: {
    religion?: string
    dietPreference?: string
  }
  step3?: {
    allergies?: string[]
    otherAllergy?: string
    activityLevel?: string
  }
  step4?: {
    medicalFiles?: string[]
    encryptionStatus?: string
  }
  step5?: {
    dreamGoal?: string
    suggestedGoals?: string[]
  }
}

export interface UpdateUserData {
  name?: string
  email?: string
  avatarUrl?: string
  height?: number
  weight?: number
  age?: number
  gender?: 'male' | 'female'
  goal?: string
  activityLevel?: string
  fitnessGoals?: string[]
  dietaryRestrictions?: string[]
  equipment?: string[]
  preferences?: User['preferences']
  medicalCondition?: string
  allergies?: string[]
  isOnboarded?: boolean
  onboardingProgress?: OnboardingProgress
}

export interface FamilyMember {
  id: string
  name: string
  avatarUrl?: string
  email?: string
  relationship: string
  age?: number
  goal?: string
  targetMacros?: { calories: number; protein: number; carbs: number; fat: number }
}

export interface Meal {
  _id: string
  day: string
  name: string
  time: string
  calories: number
  protein: number
  carbs: number
  fat: number
  macros: { calories: number; protein: number; carbs: number; fat: number }
  imageUrl?: string
  ingredients: { item: string; amount: string }[]
  instructions: { step: number; text: string }[]
  forUser?: string
}

export interface NutritionPlan {
  _id: string
  userId: string
  date: string
  targetMacros: { calories: number; protein: number; carbs: number; fat: number }
  meals: Meal[]
}

export interface Exercise {
  name: string
  sets: number
  reps: string
  restTime?: string
  isCompleted?: boolean
}

export interface WorkoutSession {
  _id: string
  dayOfWeek: string
  date?: string
  name: string
  type: 'Strength' | 'Cardio' | 'Yoga' | 'Mixed' | 'Recovery'
  durationMin: number
  estimatedCaloriesBurn: number
  isCompleted: boolean
  exercises: Exercise[]
}

export interface WorkoutPlan {
  _id: string
  userId: string
  startDate: string
  endDate: string
  sessionsCompleted: number
  sessions: WorkoutSession[]
}

export interface GroceryItem {
  name: string
  category: string
  quantity: string
  checked: boolean
  isPurchased?: boolean
  forUser?: string
}

export interface ProgressLog {
  _id: string
  userId: string
  weightKg?: number
  bodyFatPercentage?: number
  muscleMass?: number
  dailySteps?: number
  tags?: string[]
  notes?: string
  scanUrl?: string
  source?: 'manual' | 'inbody_scan'
  createdAt: string
}

export interface ActivityDay {
  date: string
  type: string
}

export interface ActivityHistory {
  activities: ActivityDay[]
  totalCheckIns: number
}

export interface Reward {
  rewardId: string
  name: string
  description: string
  requiredStreak: number
  pointsReward: number
  badgeIcon: string
  isUnlocked: boolean
  isClaimed: boolean
  progress: number
}

export interface GamificationStatus {
  currentStreak: number
  longestStreak: number
  availableFreezes: number
  totalPoints: number
  pointsToRedeem: number
  lastCheckInDate?: string
}

export interface ScheduleItem {
  type: 'meal' | 'workout'
  id: string
  name: string
  time: string
  details: {
    macros?: { calories: number; protein: number; carbs: number; fat: number }
    type?: string
    durationMin?: number
    isCompleted?: boolean
    exercises?: any[]
  }
}

export interface Schedule {
  date: string
  timeline: ScheduleItem[]
}

export const mockUser: User = {
  _id: 'user-123',
  email: 'john@example.com',
  name: 'John Doe',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  height: 175,
  weight: 70,
  age: 32,
  gender: 'male',
  goal: 'build_muscle',
  activityLevel: 'moderate',
  fitnessGoals: ['Build muscle', 'Improve endurance'],
  dietaryRestrictions: ['Vegetarian'],
  equipment: ['Dumbbells', 'Barbell', 'Pull-up bar'],
  subscriptionTier: 'PRO',
  subscription: {
    planId: 'plan_pro',
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  currentStreak: 15,
  longestStreak: 45,
  totalPoints: 3500,
  availableFreezes: 2,
  preferences: {
    notifications: true,
    weeklySummary: true,
    mealReminders: true,
    autoGenerateMeals: false,
    reminderTime: '08:00',
    reminderTypes: ['Meals', 'Workouts'],
  },
  medicalCondition: 'Asthma',
  allergies: ['Peanuts', 'Shellfish'],
  isOnboarded: true,
}

export const mockFamilyMembers: FamilyMember[] = [
  {
    id: 'family-sarah',
    name: 'Sarah Doe',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    email: 'sarah@example.com',
    relationship: 'wife',
    age: 30,
    goal: 'maintain_weight',
    targetMacros: { calories: 1800, protein: 100, carbs: 180, fat: 55 },
  },
  {
    id: 'family-emma',
    name: 'Emma Doe',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    email: 'emma@example.com',
    relationship: 'daughter',
    age: 12,
    goal: 'general_fitness',
    targetMacros: { calories: 1600, protein: 80, carbs: 200, fat: 50 },
  },
]

export const mockNutritionPlans: NutritionPlan[] = [
  {
    _id: 'plan-john-1',
    userId: 'user-123',
    date: new Date().toISOString().split('T')[0],
    targetMacros: { calories: 2200, protein: 150, carbs: 220, fat: 70 },
    meals: [
      {
        _id: 'meal-john-1',
        day: 'Monday',
        name: 'Oatmeal with Berries',
        time: '8:00 AM',
        calories: 350,
        protein: 12,
        carbs: 60,
        fat: 8,
        macros: { calories: 350, protein: 12, carbs: 60, fat: 8 },
        imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a5b24469d?w=200',
        ingredients: [
          { item: 'rolled oats', amount: '1 cup' },
          { item: 'almond milk', amount: '1 cup' },
          { item: 'mixed berries', amount: '1/2 cup' },
          { item: 'honey', amount: '2 tbsp' },
          { item: 'chopped almonds', amount: '1 tbsp' },
        ],
        instructions: [
          { step: 1, text: 'Bring almond milk to a simmer' },
          { step: 2, text: 'Add oats and reduce heat' },
          { step: 3, text: 'Cook for 5 minutes, stirring' },
          { step: 4, text: 'Top with berries and almonds' },
        ],
        forUser: 'John Doe',
      },
      {
        _id: 'meal-john-2',
        day: 'Monday',
        name: 'Grilled Chicken Salad',
        time: '12:30 PM',
        calories: 450,
        protein: 45,
        carbs: 15,
        fat: 20,
        macros: { calories: 450, protein: 45, carbs: 15, fat: 20 },
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200',
        ingredients: [
          { item: 'chicken breast', amount: '6 oz' },
          { item: 'mixed greens', amount: '2 cups' },
          { item: 'cherry tomatoes', amount: '1/2 cup' },
          { item: 'avocado', amount: '1/4' },
          { item: 'olive oil', amount: '1 tbsp' },
        ],
        instructions: [
          { step: 1, text: 'Season chicken with salt, pepper, herbs' },
          { step: 2, text: 'Grill chicken until cooked through' },
          { step: 3, text: 'Let rest 5 min, then slice' },
          { step: 4, text: 'Combine greens with vegetables' },
          { step: 5, text: 'Top with sliced chicken, drizzle oil' },
        ],
        forUser: 'John Doe',
      },
      {
        _id: 'meal-john-3',
        day: 'Monday',
        name: 'Salmon with Quinoa',
        time: '7:00 PM',
        calories: 550,
        protein: 40,
        carbs: 45,
        fat: 22,
        macros: { calories: 550, protein: 40, carbs: 45, fat: 22 },
        imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200',
        ingredients: [
          { item: 'salmon fillet', amount: '6 oz' },
          { item: 'quinoa', amount: '1 cup' },
          { item: 'broccoli', amount: '1 cup' },
          { item: 'lemon', amount: '1/2' },
          { item: 'garlic', amount: '2 cloves' },
        ],
        instructions: [
          { step: 1, text: 'Season salmon with garlic, lemon, herbs' },
          { step: 2, text: 'Bake salmon at 400°F for 12-15 min' },
          { step: 3, text: 'Cook quinoa per package instructions' },
          { step: 4, text: 'Steam broccoli until tender-crisp' },
          { step: 5, text: 'Serve salmon over quinoa with broccoli' },
        ],
        forUser: 'John Doe',
      },
      {
        _id: 'meal-john-4',
        day: 'Tuesday',
        name: 'Greek Yogurt Parfait',
        time: '8:00 AM',
        calories: 320,
        protein: 20,
        carbs: 45,
        fat: 6,
        macros: { calories: 320, protein: 20, carbs: 45, fat: 6 },
        imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200',
        ingredients: [
          { item: 'greek yogurt', amount: '1 cup' },
          { item: 'granola', amount: '1/2 cup' },
          { item: 'blueberries', amount: '1/2 cup' },
          { item: 'honey', amount: '1 tbsp' },
        ],
        instructions: [
          { step: 1, text: 'Layer yogurt in container' },
          { step: 2, text: 'Add granola layer' },
          { step: 3, text: 'Add blueberries' },
          { step: 4, text: 'Drizzle with honey' },
        ],
        forUser: 'John Doe',
      },
      {
        _id: 'meal-john-5',
        day: 'Tuesday',
        name: 'Turkey Wrap',
        time: '12:30 PM',
        calories: 400,
        protein: 35,
        carbs: 30,
        fat: 12,
        macros: { calories: 400, protein: 35, carbs: 30, fat: 12 },
        imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200',
        ingredients: [
          { item: 'turkey breast', amount: '4 oz' },
          { item: 'whole wheat tortilla', amount: '1' },
          { item: 'lettuce', amount: '1 cup' },
          { item: 'tomato', amount: '1/2' },
          { item: 'mustard', amount: '1 tbsp' },
        ],
        instructions: [
          { step: 1, text: 'Lay tortilla flat' },
          { step: 2, text: 'Spread mustard' },
          { step: 3, text: 'Layer turkey, lettuce, tomato' },
          { step: 4, text: 'Roll tightly' },
        ],
        forUser: 'John Doe',
      },
      {
        _id: 'meal-john-6',
        day: 'Tuesday',
        name: 'Beef Stir Fry',
        time: '7:00 PM',
        calories: 580,
        protein: 42,
        carbs: 50,
        fat: 20,
        macros: { calories: 580, protein: 42, carbs: 50, fat: 20 },
        imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200',
        ingredients: [
          { item: 'beef sirloin', amount: '6 oz' },
          { item: 'brown rice', amount: '1 cup' },
          { item: 'bell peppers', amount: '1 cup' },
          { item: 'broccoli', amount: '1 cup' },
          { item: 'soy sauce', amount: '2 tbsp' },
        ],
        instructions: [
          { step: 1, text: 'Slice beef into strips' },
          { step: 2, text: 'Cook rice per package' },
          { step: 3, text: 'Stir fry beef until browned' },
          { step: 4, text: 'Add vegetables, soy sauce' },
          { step: 5, text: 'Cook until vegetables tender' },
          { step: 6, text: 'Serve over rice' },
        ],
        forUser: 'John Doe',
      },
      {
        _id: 'meal-john-7',
        day: 'Wednesday',
        name: 'Scrambled Eggs on Toast',
        time: '8:00 AM',
        calories: 380,
        protein: 18,
        carbs: 35,
        fat: 18,
        macros: { calories: 380, protein: 18, carbs: 35, fat: 18 },
        imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200',
        ingredients: [
          { item: 'eggs', amount: '3' },
          { item: 'whole grain bread', amount: '2 slices' },
          { item: 'butter', amount: '1 tbsp' },
          { item: 'chives', amount: '1 tbsp' },
        ],
        instructions: [
          { step: 1, text: 'Whisk eggs with salt and pepper' },
          { step: 2, text: 'Melt butter in pan over medium heat' },
          { step: 3, text: 'Scramble eggs until just set' },
          { step: 4, text: 'Toast bread' },
          { step: 5, text: 'Serve eggs on toast, garnish with chives' },
        ],
        forUser: 'John Doe',
      },
      {
        _id: 'meal-john-8',
        day: 'Wednesday',
        name: 'Tuna Salad Wrap',
        time: '12:30 PM',
        calories: 420,
        protein: 32,
        carbs: 28,
        fat: 18,
        macros: { calories: 420, protein: 32, carbs: 28, fat: 18 },
        imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200',
        ingredients: [
          { item: 'canned tuna', amount: '5 oz' },
          { item: 'greek yogurt', amount: '2 tbsp' },
          { item: 'celery', amount: '1 stalk' },
          { item: 'tortilla', amount: '1' },
          { item: 'lettuce', amount: '1 cup' },
        ],
        instructions: [
          { step: 1, text: 'Drain tuna and place in bowl' },
          { step: 2, text: 'Mix with yogurt, diced celery, salt, pepper' },
          { step: 3, text: 'Lay tortilla flat' },
          { step: 4, text: 'Add lettuce and tuna mixture' },
          { step: 5, text: 'Roll up tightly' },
        ],
        forUser: 'John Doe',
      },
      {
        _id: 'meal-john-9',
        day: 'Wednesday',
        name: 'Chicken Fried Rice',
        time: '7:00 PM',
        calories: 520,
        protein: 35,
        carbs: 55,
        fat: 16,
        macros: { calories: 520, protein: 35, carbs: 55, fat: 16 },
        imageUrl: 'https://images.unsplash.com/photo-1603133872878-6846e7c3a017?w=200',
        ingredients: [
          { item: 'chicken breast', amount: '5 oz' },
          { item: 'cooked rice', amount: '1.5 cups' },
          { item: 'eggs', amount: '2' },
          { item: 'peas and carrots', amount: '1/2 cup' },
          { item: 'soy sauce', amount: '2 tbsp' },
        ],
        instructions: [
          { step: 1, text: 'Dice chicken breast' },
          { step: 2, text: 'Scramble eggs in wok, set aside' },
          { step: 3, text: 'Stir fry chicken until cooked' },
          { step: 4, text: 'Add rice and vegetables' },
          { step: 5, text: 'Pour soy sauce, mix well' },
          { step: 6, text: 'Add eggs back, serve hot' },
        ],
        forUser: 'John Doe',
      },
      {
        _id: 'meal-john-10',
        day: 'Thursday',
        name: 'Protein Smoothie',
        time: '8:00 AM',
        calories: 340,
        protein: 28,
        carbs: 42,
        fat: 6,
        macros: { calories: 340, protein: 28, carbs: 42, fat: 6 },
        imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=200',
        ingredients: [
          { item: 'protein powder', amount: '1 scoop' },
          { item: 'banana', amount: '1' },
          { item: 'almond milk', amount: '1 cup' },
          { item: 'peanut butter', amount: '1 tbsp' },
        ],
        instructions: [
          { step: 1, text: 'Add almond milk to blender' },
          { step: 2, text: 'Add protein powder and banana' },
          { step: 3, text: 'Add peanut butter' },
          { step: 4, text: 'Blend until smooth' },
          { step: 5, text: 'Pour and serve immediately' },
        ],
        forUser: 'John Doe',
      },
      {
        _id: 'meal-john-11',
        day: 'Thursday',
        name: 'Grilled Salmon Salad',
        time: '12:30 PM',
        calories: 480,
        protein: 38,
        carbs: 18,
        fat: 26,
        macros: { calories: 480, protein: 38, carbs: 18, fat: 26 },
        imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200',
        ingredients: [
          { item: 'salmon fillet', amount: '6 oz' },
          { item: 'mixed greens', amount: '2 cups' },
          { item: 'cucumber', amount: '1/2' },
          { item: 'cherry tomatoes', amount: '1/2 cup' },
          { item: 'avocado', amount: '1/4' },
        ],
        instructions: [
          { step: 1, text: 'Season salmon with lemon, salt, pepper' },
          { step: 2, text: 'Grill salmon 4 min each side' },
          { step: 3, text: 'Let rest 2 min, then slice' },
          { step: 4, text: 'Arrange greens in bowl' },
          { step: 5, text: 'Top with salmon and vegetables' },
        ],
        forUser: 'John Doe',
      },
      {
        _id: 'meal-john-12',
        day: 'Thursday',
        name: 'Beef Tacos',
        time: '7:00 PM',
        calories: 540,
        protein: 36,
        carbs: 45,
        fat: 22,
        macros: { calories: 540, protein: 36, carbs: 45, fat: 22 },
        imageUrl: 'https://images.unsplash.com/photo-1565299585326-38d10e355a93?w=200',
        ingredients: [
          { item: 'ground beef', amount: '6 oz' },
          { item: 'taco shells', amount: '3' },
          { item: 'cheddar cheese', amount: '1/4 cup' },
          { item: 'lettuce', amount: '1/2 cup' },
          { item: 'tomato', amount: '1/2' },
        ],
        instructions: [
          { step: 1, text: 'Brown ground beef in pan' },
          { step: 2, text: 'Add taco seasoning' },
          { step: 3, text: 'Warm taco shells' },
          { step: 4, text: 'Fill shells with beef' },
          { step: 5, text: 'Top with cheese, lettuce, tomato' },
        ],
        forUser: 'John Doe',
      },
      {
        _id: 'meal-john-13',
        day: 'Friday',
        name: 'Overnight Oats',
        time: '8:00 AM',
        calories: 360,
        protein: 14,
        carbs: 55,
        fat: 8,
        macros: { calories: 360, protein: 14, carbs: 55, fat: 8 },
        imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a5b24469d?w=200',
        ingredients: [
          { item: 'rolled oats', amount: '1/2 cup' },
          { item: 'almond milk', amount: '1/2 cup' },
          { item: 'chia seeds', amount: '1 tbsp' },
          { item: 'maple syrup', amount: '1 tbsp' },
          { item: 'blueberries', amount: '1/4 cup' },
        ],
        instructions: [
          { step: 1, text: 'Combine oats, milk, chia seeds in jar' },
          { step: 2, text: 'Add maple syrup, stir well' },
          { step: 3, text: 'Refrigerate overnight' },
          { step: 4, text: 'Top with blueberries before serving' },
        ],
        forUser: 'John Doe',
      },
      {
        _id: 'meal-john-14',
        day: 'Friday',
        name: 'Chicken Caesar Salad',
        time: '12:30 PM',
        calories: 460,
        protein: 40,
        carbs: 18,
        fat: 24,
        macros: { calories: 460, protein: 40, carbs: 18, fat: 24 },
        imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683e5a3ad?w=200',
        ingredients: [
          { item: 'chicken breast', amount: '6 oz' },
          { item: 'romaine lettuce', amount: '2 cups' },
          { item: 'parmesan', amount: '2 tbsp' },
          { item: 'croutons', amount: '1/4 cup' },
          { item: 'caesar dressing', amount: '2 tbsp' },
        ],
        instructions: [
          { step: 1, text: 'Grill chicken until cooked' },
          { step: 2, text: 'Let rest, then slice' },
          { step: 3, text: 'Chop romaine lettuce' },
          { step: 4, text: 'Toss lettuce with dressing' },
          { step: 5, text: 'Top with chicken, parmesan, croutons' },
        ],
        forUser: 'John Doe',
      },
      {
        _id: 'meal-john-15',
        day: 'Friday',
        name: 'Shrimp Pasta',
        time: '7:00 PM',
        calories: 560,
        protein: 32,
        carbs: 60,
        fat: 18,
        macros: { calories: 560, protein: 32, carbs: 60, fat: 18 },
        imageUrl: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=200',
        ingredients: [
          { item: 'shrimp', amount: '6 oz' },
          { item: 'pasta', amount: '2 cups' },
          { item: 'garlic', amount: '3 cloves' },
          { item: 'olive oil', amount: '2 tbsp' },
          { item: 'parsley', amount: '2 tbsp' },
        ],
        instructions: [
          { step: 1, text: 'Cook pasta per package instructions' },
          { step: 2, text: 'Sauté garlic in olive oil' },
          { step: 3, text: 'Add shrimp, cook until pink' },
          { step: 4, text: 'Toss with pasta' },
          { step: 5, text: 'Garnish with parsley' },
        ],
        forUser: 'John Doe',
      },
      {
        _id: 'meal-john-16',
        day: 'Saturday',
        name: ' Breakfast Burrito',
        time: '9:00 AM',
        calories: 520,
        protein: 24,
        carbs: 48,
        fat: 24,
        macros: { calories: 520, protein: 24, carbs: 48, fat: 24 },
        imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200',
        ingredients: [
          { item: 'eggs', amount: '3' },
          { item: 'large tortilla', amount: '1' },
          { item: 'black beans', amount: '1/2 cup' },
          { item: 'cheese', amount: '2 tbsp' },
          { item: 'salsa', amount: '2 tbsp' },
        ],
        instructions: [
          { step: 1, text: 'Scramble eggs' },
          { step: 2, text: 'Warm tortilla' },
          { step: 3, text: 'Layer eggs, beans, cheese on tortilla' },
          { step: 4, text: 'Add salsa' },
          { step: 5, text: 'Roll tightly, serve' },
        ],
        forUser: 'John Doe',
      },
      {
        _id: 'meal-john-17',
        day: 'Saturday',
        name: 'Turkey Burger',
        time: '1:00 PM',
        calories: 440,
        protein: 32,
        carbs: 35,
        fat: 18,
        macros: { calories: 440, protein: 32, carbs: 35, fat: 18 },
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c4cd3?w=200',
        ingredients: [
          { item: 'ground turkey', amount: '6 oz' },
          { item: 'whole wheat bun', amount: '1' },
          { item: 'lettuce', amount: '1 leaf' },
          { item: 'tomato', amount: '1 slice' },
          { item: 'onion', amount: '2 slices' },
        ],
        instructions: [
          { step: 1, text: 'Form turkey into patty' },
          { step: 2, text: 'Season with salt, pepper' },
          { step: 3, text: 'Grill 4 min each side' },
          { step: 4, text: 'Toast bun' },
          { step: 5, text: 'Assemble with vegetables' },
        ],
        forUser: 'John Doe',
      },
      {
        _id: 'meal-john-18',
        day: 'Saturday',
        name: 'Baked Cod with Veggies',
        time: '6:30 PM',
        calories: 420,
        protein: 38,
        carbs: 30,
        fat: 14,
        macros: { calories: 420, protein: 38, carbs: 30, fat: 14 },
        imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200',
        ingredients: [
          { item: 'cod fillet', amount: '6 oz' },
          { item: 'asparagus', amount: '1 cup' },
          { item: 'cherry tomatoes', amount: '1/2 cup' },
          { item: 'lemon', amount: '1/2' },
          { item: 'olive oil', amount: '1 tbsp' },
        ],
        instructions: [
          { step: 1, text: 'Place cod on baking sheet' },
          { step: 2, text: 'Arrange vegetables around' },
          { step: 3, text: 'Drizzle with olive oil, lemon' },
          { step: 4, text: 'Bake at 400°F for 12-15 min' },
        ],
        forUser: 'John Doe',
      },
      {
        _id: 'meal-john-19',
        day: 'Sunday',
        name: 'Pancakes with Fruit',
        time: '9:00 AM',
        calories: 420,
        protein: 12,
        carbs: 70,
        fat: 10,
        macros: { calories: 420, protein: 12, carbs: 70, fat: 10 },
        imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200',
        ingredients: [
          { item: 'pancake mix', amount: '1 cup' },
          { item: 'eggs', amount: '1' },
          { item: 'milk', amount: '3/4 cup' },
          { item: 'strawberries', amount: '1/2 cup' },
          { item: 'maple syrup', amount: '2 tbsp' },
        ],
        instructions: [
          { step: 1, text: 'Mix pancake batter' },
          { step: 2, text: 'Cook on griddle until bubbly' },
          { step: 3, text: 'Flip, cook until golden' },
          { step: 4, text: 'Stack pancakes' },
          { step: 5, text: 'Top with fruit and syrup' },
        ],
        forUser: 'John Doe',
      },
      {
        _id: 'meal-john-20',
        day: 'Sunday',
        name: 'Grilled Chicken Bowl',
        time: '1:00 PM',
        calories: 480,
        protein: 40,
        carbs: 45,
        fat: 14,
        macros: { calories: 480, protein: 40, carbs: 45, fat: 14 },
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200',
        ingredients: [
          { item: 'chicken breast', amount: '6 oz' },
          { item: 'brown rice', amount: '1 cup' },
          { item: 'edamame', amount: '1/2 cup' },
          { item: 'carrots', amount: '1/4 cup' },
          { item: 'soy sauce', amount: '1 tbsp' },
        ],
        instructions: [
          { step: 1, text: 'Season and grill chicken' },
          { step: 2, text: 'Cook rice' },
          { step: 3, text: 'Slice chicken' },
          { step: 4, text: 'Arrange rice in bowl' },
          { step: 5, text: 'Top with chicken and vegetables' },
        ],
        forUser: 'John Doe',
      },
      {
        _id: 'meal-john-21',
        day: 'Sunday',
        name: 'Steak and Sweet Potato',
        time: '7:00 PM',
        calories: 580,
        protein: 42,
        carbs: 40,
        fat: 24,
        macros: { calories: 580, protein: 42, carbs: 40, fat: 24 },
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9c581a5b996?w=200',
        ingredients: [
          { item: 'steak', amount: '6 oz' },
          { item: 'sweet potato', amount: '1 medium' },
          { item: 'broccoli', amount: '1 cup' },
          { item: 'garlic', amount: '2 cloves' },
          { item: 'butter', amount: '1 tbsp' },
        ],
        instructions: [
          { step: 1, text: 'Season steak with salt, pepper, garlic' },
          { step: 2, text: 'Grill steak to desired doneness' },
          { step: 3, text: 'Bake sweet potato until tender' },
          { step: 4, text: 'Steam broccoli' },
          { step: 5, text: 'Slice steak, serve with sides' },
        ],
        forUser: 'John Doe',
      },
    ],
  },
  {
    _id: 'plan-sarah-1',
    userId: 'family-sarah',
    date: new Date().toISOString().split('T')[0],
    targetMacros: { calories: 1800, protein: 100, carbs: 180, fat: 55 },
    meals: [
      {
        _id: 'meal-sarah-1',
        day: 'Monday',
        name: 'Avocado Toast',
        time: '8:00 AM',
        calories: 280,
        protein: 10,
        carbs: 35,
        fat: 14,
        macros: { calories: 280, protein: 10, carbs: 35, fat: 14 },
        imageUrl: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=200',
        ingredients: [
          { item: 'whole grain bread', amount: '2 slices' },
          { item: 'avocado', amount: '1/2' },
          { item: 'eggs', amount: '1' },
          { item: 'red pepper flakes', amount: '1/4 tsp' },
          { item: 'salt', amount: 'pinch' },
        ],
        instructions: [
          { step: 1, text: 'Toast bread' },
          { step: 2, text: 'Mash avocado with salt' },
          { step: 3, text: 'Spread on toast' },
          { step: 4, text: 'Top with poached egg' },
          { step: 5, text: 'Sprinkle with red pepper flakes' },
        ],
        forUser: 'Sarah Doe',
      },
      {
        _id: 'meal-sarah-2',
        day: 'Monday',
        name: 'Quinoa Buddha Bowl',
        time: '12:30 PM',
        calories: 420,
        protein: 18,
        carbs: 55,
        fat: 14,
        macros: { calories: 420, protein: 18, carbs: 55, fat: 14 },
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a590426f7f87?w=200',
        ingredients: [
          { item: 'quinoa', amount: '1/2 cup' },
          { item: 'chickpeas', amount: '1/2 cup' },
          { item: 'cucumber', amount: '1/2 cup' },
          { item: 'cherry tomatoes', amount: '1/2 cup' },
          { item: 'tahini', amount: '2 tbsp' },
        ],
        instructions: [
          { step: 1, text: 'Cook quinoa' },
          { step: 2, text: 'Arrange chickpeas, cucumber, tomatoes in bowl' },
          { step: 3, text: 'Top with quinoa' },
          { step: 4, text: 'Drizzle with tahini dressing' },
        ],
        forUser: 'Sarah Doe',
      },
      {
        _id: 'meal-sarah-3',
        day: 'Monday',
        name: 'Mediterranean Chicken',
        time: '7:00 PM',
        calories: 480,
        protein: 38,
        carbs: 25,
        fat: 22,
        macros: { calories: 480, protein: 38, carbs: 25, fat: 22 },
        imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73dfd10?w=200',
        ingredients: [
          { item: 'chicken breast', amount: '5 oz' },
          { item: 'couscous', amount: '1/2 cup' },
          { item: 'feta cheese', amount: '1/4 cup' },
          { item: 'olives', amount: '1/4 cup' },
          { item: 'sun-dried tomatoes', amount: '2 tbsp' },
        ],
        instructions: [
          { step: 1, text: 'Season chicken with Mediterranean spices' },
          { step: 2, text: 'Grill until cooked' },
          { step: 3, text: 'Cook couscous' },
          { step: 4, text: 'Slice chicken over couscous' },
          { step: 5, text: 'Top with feta and olives' },
        ],
        forUser: 'Sarah Doe',
      },
    ],
  },
  {
    _id: 'plan-emma-1',
    userId: 'family-emma',
    date: new Date().toISOString().split('T')[0],
    targetMacros: { calories: 1600, protein: 80, carbs: 200, fat: 50 },
    meals: [
      {
        _id: 'meal-emma-1',
        day: 'Monday',
        name: 'Pancakes + Fruit',
        time: '8:00 AM',
        calories: 380,
        protein: 14,
        carbs: 65,
        fat: 8,
        macros: { calories: 380, protein: 14, carbs: 65, fat: 8 },
        imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200',
        ingredients: [
          { item: 'pancake mix', amount: '1 cup' },
          { item: 'eggs', amount: '1' },
          { item: 'milk', amount: '3/4 cup' },
          { item: 'banana', amount: '1' },
          { item: 'maple syrup', amount: '2 tbsp' },
        ],
        instructions: [
          { step: 1, text: 'Mix pancake batter' },
          { step: 2, text: 'Cook pancakes on griddle' },
          { step: 3, text: 'Slice banana' },
          { step: 4, text: 'Serve with banana and syrup' },
        ],
        forUser: 'Emma Doe',
      },
      {
        _id: 'meal-emma-2',
        day: 'Monday',
        name: 'Turkey Cheese Wrap',
        time: '12:30 PM',
        calories: 350,
        protein: 25,
        carbs: 35,
        fat: 10,
        macros: { calories: 350, protein: 25, carbs: 35, fat: 10 },
        imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200',
        ingredients: [
          { item: 'turkey slices', amount: '3 oz' },
          { item: 'cheese slice', amount: '1' },
          { item: 'tortilla', amount: '1' },
          { item: 'lettuce', amount: '1/2 cup' },
        ],
        instructions: [
          { step: 1, text: 'Layer turkey and cheese on tortilla' },
          { step: 2, text: 'Add lettuce' },
          { step: 3, text: 'Roll up tightly' },
          { step: 4, text: 'Cut in half' },
        ],
        forUser: 'Emma Doe',
      },
      {
        _id: 'meal-emma-3',
        day: 'Monday',
        name: 'Pasta with Meatballs',
        time: '6:30 PM',
        calories: 520,
        protein: 28,
        carbs: 70,
        fat: 14,
        macros: { calories: 520, protein: 28, carbs: 70, fat: 14 },
        imageUrl: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=200',
        ingredients: [
          { item: 'pasta', amount: '1.5 cups' },
          { item: 'beef meatballs', amount: '6' },
          { item: 'marinara sauce', amount: '1/2 cup' },
          { item: 'parmesan', amount: '2 tbsp' },
        ],
        instructions: [
          { step: 1, text: 'Cook pasta per package' },
          { step: 2, text: 'Heat meatballs in sauce' },
          { step: 3, text: 'Toss pasta with sauce' },
          { step: 4, text: 'Top with meatballs and parmesan' },
        ],
        forUser: 'Emma Doe',
      },
    ],
  },
]

export const mockWorkoutPlan: WorkoutPlan = {
  _id: 'workout-plan-1',
  userId: 'user-123',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 8 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  sessionsCompleted: 12,
  sessions: [
    {
      _id: 'session-push-1',
      dayOfWeek: 'Monday',
      name: 'Push Day - Chest, Shoulders, Triceps',
      type: 'Strength',
      durationMin: 60,
      estimatedCaloriesBurn: 350,
      isCompleted: true,
      exercises: [
        { name: 'Bench Press', sets: 4, reps: '8-10', restTime: '90s', isCompleted: true },
        { name: 'Overhead Press', sets: 3, reps: '10', restTime: '60s', isCompleted: true },
        { name: 'Incline Dumbbell Press', sets: 3, reps: '12', restTime: '60s', isCompleted: true },
        { name: 'Lateral Raises', sets: 3, reps: '15', restTime: '45s', isCompleted: true },
        { name: 'Tricep Dips', sets: 3, reps: '12', restTime: '60s', isCompleted: true },
      ],
    },
    {
      _id: 'session-pull-1',
      dayOfWeek: 'Tuesday',
      name: 'Pull Day - Back, Biceps',
      type: 'Strength',
      durationMin: 55,
      estimatedCaloriesBurn: 300,
      isCompleted: true,
      exercises: [
        { name: 'Deadlift', sets: 4, reps: '6', restTime: '120s', isCompleted: true },
        { name: 'Pull-ups', sets: 3, reps: '8-10', restTime: '90s', isCompleted: true },
        { name: 'Barbell Row', sets: 3, reps: '10', restTime: '90s', isCompleted: true },
        { name: 'Face Pulls', sets: 3, reps: '15', restTime: '45s', isCompleted: true },
        { name: 'Dumbbell Curls', sets: 3, reps: '12', restTime: '45s', isCompleted: true },
      ],
    },
    {
      _id: 'session-legs-1',
      dayOfWeek: 'Wednesday',
      name: 'Leg Day - Quads, Hamstrings, Calves',
      type: 'Strength',
      durationMin: 65,
      estimatedCaloriesBurn: 400,
      isCompleted: false,
      exercises: [
        { name: 'Squats', sets: 4, reps: '8', restTime: '120s' },
        { name: 'Romanian Deadlift', sets: 3, reps: '10', restTime: '90s' },
        { name: 'Leg Press', sets: 3, reps: '12', restTime: '90s' },
        { name: 'Leg Curls', sets: 3, reps: '12', restTime: '60s' },
        { name: 'Calf Raises', sets: 4, reps: '15', restTime: '45s' },
      ],
    },
    {
      _id: 'session-rest-1',
      dayOfWeek: 'Thursday',
      name: 'Rest Day',
      type: 'Recovery',
      durationMin: 30,
      estimatedCaloriesBurn: 80,
      isCompleted: false,
      exercises: [
        { name: 'Stretching', sets: 1, reps: '15 min' },
        { name: 'Foam Rolling', sets: 1, reps: '15 min' },
      ],
    },
    {
      _id: 'session-push-2',
      dayOfWeek: 'Friday',
      name: 'Push Day - Chest, Shoulders, Triceps',
      type: 'Strength',
      durationMin: 60,
      estimatedCaloriesBurn: 350,
      isCompleted: false,
      exercises: [
        { name: 'Bench Press', sets: 4, reps: '8-10', restTime: '90s' },
        { name: 'Overhead Press', sets: 3, reps: '10', restTime: '60s' },
        { name: 'Incline Dumbbell Press', sets: 3, reps: '12', restTime: '60s' },
        { name: 'Lateral Raises', sets: 3, reps: '15', restTime: '45s' },
        { name: 'Tricep Dips', sets: 3, reps: '12', restTime: '60s' },
      ],
    },
    {
      _id: 'session-pull-2',
      dayOfWeek: 'Saturday',
      name: 'Pull Day - Back, Biceps',
      type: 'Strength',
      durationMin: 55,
      estimatedCaloriesBurn: 300,
      isCompleted: false,
      exercises: [
        { name: 'Deadlift', sets: 4, reps: '6', restTime: '120s' },
        { name: 'Pull-ups', sets: 3, reps: '8-10', restTime: '90s' },
        { name: 'Barbell Row', sets: 3, reps: '10', restTime: '90s' },
        { name: 'Face Pulls', sets: 3, reps: '15', restTime: '45s' },
        { name: 'Dumbbell Curls', sets: 3, reps: '12', restTime: '45s' },
      ],
    },
    {
      _id: 'session-cardio-1',
      dayOfWeek: 'Sunday',
      name: 'Active Recovery - Cardio',
      type: 'Cardio',
      durationMin: 45,
      estimatedCaloriesBurn: 280,
      isCompleted: false,
      exercises: [
        { name: 'Light Jog', sets: 1, reps: '20 min' },
        { name: 'Cycling', sets: 1, reps: '20 min' },
        { name: 'Jump Rope', sets: 3, reps: '1 min' },
      ],
    },
  ],
}

export const mockGroceryList: GroceryItem[] = [
  { name: 'Rolled oats', category: 'Grains', quantity: '2 cups', checked: false },
  { name: 'Almond milk', category: 'Dairy', quantity: '2 cartons', checked: false },
  { name: 'Mixed berries', category: 'Produce', quantity: '2 cups', checked: false, forUser: 'John Doe' },
  { name: 'Greek yogurt', category: 'Dairy', quantity: '2 cups', checked: false, forUser: 'John Doe' },
  { name: 'Granola', category: 'Grains', quantity: '1 cup', checked: false, forUser: 'John Doe' },
  { name: 'Chicken breast', category: 'Meat', quantity: '2 lbs', checked: false },
  { name: 'Turkey breast', category: 'Meat', quantity: '1 lb', checked: false },
  { name: 'Salmon fillet', category: 'Seafood', quantity: '1 lb', checked: false, forUser: 'John Doe' },
  { name: 'Beef sirloin', category: 'Meat', quantity: '1 lb', checked: false, forUser: 'John Doe' },
  { name: 'Ground beef', category: 'Meat', quantity: '1 lb', checked: false, forUser: 'Emma Doe' },
  { name: 'Beef meatballs', category: 'Meat', quantity: '1 pack', checked: false, forUser: 'Emma Doe' },
  { name: 'Quinoa', category: 'Grains', quantity: '2 cups', checked: false },
  { name: 'Brown rice', category: 'Grains', quantity: '2 cups', checked: false },
  { name: 'Pasta', category: 'Grains', quantity: '2 boxes', checked: false, forUser: 'Emma Doe' },
  { name: 'Couscous', category: 'Grains', quantity: '1 cup', checked: false, forUser: 'Sarah Doe' },
  { name: 'Whole wheat tortilla', category: 'Grains', quantity: '8 pack', checked: false },
  { name: 'Mixed greens', category: 'Produce', quantity: '1 bag', checked: false },
  { name: 'Avocado', category: 'Produce', quantity: '3', checked: false },
  { name: 'Broccoli', category: 'Produce', quantity: '2 heads', checked: false },
  { name: 'Bell peppers', category: 'Produce', quantity: '3', checked: false, forUser: 'John Doe' },
  { name: 'Cucumber', category: 'Produce', quantity: '2', checked: false, forUser: 'Sarah Doe' },
  { name: 'Cherry tomatoes', category: 'Produce', quantity: '1 pint', checked: false },
  { name: 'Tomato', category: 'Produce', quantity: '3', checked: false },
  { name: 'Banana', category: 'Produce', quantity: '4', checked: false, forUser: 'Emma Doe' },
  { name: 'Blueberries', category: 'Produce', quantity: '1 cup', checked: false, forUser: 'John Doe' },
  { name: 'Lettuce', category: 'Produce', quantity: '2 heads', checked: false },
  { name: 'Chickpeas', category: 'Canned', quantity: '1 can', checked: false, forUser: 'Sarah Doe' },
  { name: 'Olives', category: 'Canned', quantity: '1 jar', checked: false, forUser: 'Sarah Doe' },
  { name: 'Sun-dried tomatoes', category: 'Canned', quantity: '1 jar', checked: false, forUser: 'Sarah Doe' },
  { name: 'Feta cheese', category: 'Dairy', quantity: '1 cup', checked: false, forUser: 'Sarah Doe' },
  { name: 'Parmesan', category: 'Dairy', quantity: '1 cup', checked: false, forUser: 'Emma Doe' },
  { name: 'Cheddar cheese', category: 'Dairy', quantity: '8 oz', checked: false, forUser: 'Emma Doe' },
  { name: 'Eggs', category: 'Dairy', quantity: '2 dozen', checked: false },
  { name: 'Milk', category: 'Dairy', quantity: '1 gallon', checked: false, forUser: 'Emma Doe' },
  { name: 'Honey', category: 'Pantry', quantity: '1 bottle', checked: false },
  { name: 'Maple syrup', category: 'Pantry', quantity: '1 bottle', checked: false, forUser: 'Emma Doe' },
  { name: 'Olive oil', category: 'Pantry', quantity: '1 bottle', checked: false },
  { name: 'Soy sauce', category: 'Pantry', quantity: '1 bottle', checked: false, forUser: 'John Doe' },
  { name: 'Tahini', category: 'Pantry', quantity: '1 jar', checked: false, forUser: 'Sarah Doe' },
  { name: 'Marinara sauce', category: 'Pantry', quantity: '1 jar', checked: false, forUser: 'Emma Doe' },
  { name: 'Red pepper flakes', category: 'Spices', quantity: '1 bottle', checked: false },
  { name: 'Garlic', category: 'Produce', quantity: '1 head', checked: false },
  { name: 'Lemon', category: 'Produce', quantity: '3', checked: false },
  { name: 'Almonds', category: 'Pantry', quantity: '1 cup', checked: false, forUser: 'John Doe' },
  { name: 'Pancake mix', category: 'Grains', quantity: '1 box', checked: false, forUser: 'Emma Doe' },
]

export const mockProgressLogs: ProgressLog[] = [
  { _id: 'log-1', userId: 'user-123', weightKg: 75, bodyFatPercentage: 20, muscleMass: 32, dailySteps: 8500, createdAt: '2026-01-01' },
  { _id: 'log-2', userId: 'user-123', weightKg: 74.5, bodyFatPercentage: 19.5, muscleMass: 32.2, dailySteps: 9200, createdAt: '2026-01-08' },
  { _id: 'log-3', userId: 'user-123', weightKg: 74, bodyFatPercentage: 19, muscleMass: 32.5, dailySteps: 7800, createdAt: '2026-01-15' },
  { _id: 'log-4', userId: 'user-123', weightKg: 73.2, bodyFatPercentage: 18.5, muscleMass: 33, dailySteps: 10500, createdAt: '2026-01-22' },
  { _id: 'log-5', userId: 'user-123', weightKg: 72.5, bodyFatPercentage: 18, muscleMass: 33.5, dailySteps: 9800, createdAt: '2026-01-29' },
  { _id: 'log-6', userId: 'user-123', weightKg: 72, bodyFatPercentage: 17.5, muscleMass: 34, dailySteps: 11000, createdAt: '2026-02-05' },
  { _id: 'log-7', userId: 'user-123', weightKg: 71.5, bodyFatPercentage: 17, muscleMass: 34.2, dailySteps: 10200, createdAt: '2026-02-12' },
  { _id: 'log-8', userId: 'user-123', weightKg: 71, bodyFatPercentage: 16.5, muscleMass: 34.8, dailySteps: 11500, createdAt: '2026-02-19' },
  { _id: 'log-9', userId: 'user-123', weightKg: 70.5, bodyFatPercentage: 16, muscleMass: 35, dailySteps: 10800, createdAt: '2026-02-26' },
  { _id: 'log-10', userId: 'user-123', weightKg: 70, bodyFatPercentage: 15.5, muscleMass: 35.5, dailySteps: 12000, createdAt: '2026-03-05' },
  { _id: 'log-11', userId: 'user-123', weightKg: 70, bodyFatPercentage: 15, muscleMass: 36, tags: ['gains'], createdAt: '2026-03-12' },
  { _id: 'log-12', userId: 'user-123', weightKg: 70, bodyFatPercentage: 14.5, muscleMass: 36.5, createdAt: '2026-03-19' },
  { _id: 'log-13', userId: 'user-123', weightKg: 70, bodyFatPercentage: 14, muscleMass: 37, createdAt: '2026-03-26' },
  { _id: 'log-14', userId: 'user-123', weightKg: 70, bodyFatPercentage: 13.5, muscleMass: 37.5, notes: 'Feeling stronger than ever!', createdAt: '2026-04-02' },
  { _id: 'log-15', userId: 'user-123', weightKg: 70, bodyFatPercentage: 13, muscleMass: 38, notes: 'Hit new PR on deadlift: 235 lbs', createdAt: '2026-04-09' },
  { _id: 'log-16', userId: 'user-123', weightKg: 70, bodyFatPercentage: 12.5, muscleMass: 38.5, tags: ['locked_in'], notes: 'Best shape of my life', createdAt: '2026-04-16' },
  { _id: 'log-17', userId: 'user-123', weightKg: 70, bodyFatPercentage: 12, muscleMass: 39, createdAt: '2026-04-23' },
]

export const mockActivityHistory: ActivityHistory = {
  activities: [
    { date: '2026-04-01', type: 'check-in' },
    { date: '2026-04-02', type: 'check-in' },
    { date: '2026-04-03', type: 'check-in' },
    { date: '2026-04-04', type: 'check-in' },
    { date: '2026-04-05', type: 'check-in' },
    { date: '2026-04-06', type: 'check-in' },
    { date: '2026-04-07', type: 'check-in' },
    { date: '2026-04-08', type: 'check-in' },
    { date: '2026-04-09', type: 'check-in' },
    { date: '2026-04-10', type: 'check-in' },
    { date: '2026-04-11', type: 'check-in' },
    { date: '2026-04-12', type: 'check-in' },
    { date: '2026-04-13', type: 'check-in' },
    { date: '2026-04-14', type: 'check-in' },
    { date: '2026-04-15', type: 'check-in' },
    { date: '2026-04-16', type: 'check-in' },
    { date: '2026-04-17', type: 'check-in' },
    { date: '2026-04-18', type: 'check-in' },
    { date: '2026-04-19', type: 'check-in' },
    { date: '2026-04-20', type: 'check-in' },
    { date: '2026-04-21', type: 'check-in' },
    { date: '2026-04-22', type: 'check-in' },
    { date: '2026-04-23', type: 'check-in' },
  ],
  totalCheckIns: 23,
}

export const mockGamificationStatus: GamificationStatus = {
  currentStreak: 15,
  longestStreak: 45,
  availableFreezes: 2,
  totalPoints: 3500,
  pointsToRedeem: 2800,
  lastCheckInDate: new Date().toISOString(),
}

export const mockRewards: Reward[] = [
  {
    rewardId: 'streak-7',
    name: 'Week Warrior',
    description: 'Complete a 7-day streak',
    requiredStreak: 7,
    pointsReward: 100,
    badgeIcon: 'medal',
    isUnlocked: true,
    isClaimed: true,
    progress: 100,
  },
  {
    rewardId: 'streak-14',
    name: 'Two Week Champion',
    description: 'Complete a 14-day streak',
    requiredStreak: 14,
    pointsReward: 200,
    badgeIcon: 'trophy',
    isUnlocked: true,
    isClaimed: true,
    progress: 100,
  },
  {
    rewardId: 'streak-21',
    name: 'Three Week Master',
    description: 'Complete a 21-day streak',
    requiredStreak: 21,
    pointsReward: 300,
    badgeIcon: 'crown',
    isUnlocked: true,
    isClaimed: true,
    progress: 100,
  },
  {
    rewardId: 'streak-30',
    name: 'Monthly Monster',
    description: 'Complete a 30-day streak',
    requiredStreak: 30,
    pointsReward: 500,
    badgeIcon: 'star',
    isUnlocked: true,
    isClaimed: false,
    progress: 100,
  },
  {
    rewardId: 'streak-45',
    name: 'Streak Legend',
    description: 'Complete a 45-day streak',
    requiredStreak: 45,
    pointsReward: 750,
    badgeIcon: 'shield',
    isUnlocked: false,
    isClaimed: false,
    progress: 33,
  },
  {
    rewardId: 'streak-60',
    name: 'Streak Immortal',
    description: 'Complete a 60-day streak',
    requiredStreak: 60,
    pointsReward: 1000,
    badgeIcon: 'crown',
    isUnlocked: false,
    isClaimed: false,
    progress: 25,
  },
  {
    rewardId: 'streak-100',
    name: 'Century Champion',
    description: 'Complete a 100-day streak',
    requiredStreak: 100,
    pointsReward: 2000,
    badgeIcon: 'legend',
    isUnlocked: false,
    isClaimed: false,
    progress: 15,
  },
]

export const mockSchedule: Schedule = {
  date: new Date().toISOString().split('T')[0],
  timeline: [
    { type: 'meal', id: 'meal-john-1', name: 'Oatmeal with Berries', time: '8:00 AM', details: { macros: { calories: 350, protein: 12, carbs: 60, fat: 8 } } },
    { type: 'workout', id: 'session-push-1', name: 'Push Day', time: '10:00 AM', details: { type: 'Strength', durationMin: 60 } },
    { type: 'meal', id: 'meal-john-2', name: 'Grilled Chicken Salad', time: '12:30 PM', details: { macros: { calories: 450, protein: 45, carbs: 15, fat: 20 } } },
    { type: 'meal', id: 'meal-john-3', name: 'Salmon with Quinoa', time: '7:00 PM', details: { macros: { calories: 550, protein: 40, carbs: 45, fat: 22 } } },
  ],
}