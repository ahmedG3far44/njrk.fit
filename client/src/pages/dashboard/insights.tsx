import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { gamificationService } from '../../services/gamification'
import { nutritionService } from '../../services/nutrition'
import { fitnessService } from '../../services/fitness'
import { groceryService } from '../../services/grocery'
import {
  UtensilsCrossed,
  Dumbbell,
  Flame,
  Moon,
  Droplets,
  ShoppingCart,
  Trophy,
  ArrowRight,
  Loader2,
  Camera,
  RefreshCw,
  X,
  Sparkles,
  Activity,
  Footprints,
  ChevronRight,
  Users,
  Zap,
  User,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import DashboardSkeleton from '../../components/DashboardSkeleton'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getDayOfWeek = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return new Date().getDay() // 0 = Sun
}

const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

const formatDate = () =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number
  max: number
  color: string
}

const ProgressBar = ({ value, max, color }: ProgressBarProps) => {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const InsightsPage = () => {
  const [aiDismissed, setAiDismissed] = useState(false)

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: gamificationService.getInsights,
  })

  const { data: nutrition, isLoading: nutritionLoading } = useQuery({
    queryKey: ['nutrition'],
    queryFn: () => nutritionService.getCurrent(),
  })

  const { data: fitness, isLoading: fitnessLoading } = useQuery({
    queryKey: ['fitness'],
    queryFn: () => fitnessService.getCurrent(),
  })

  const { data: groceries, isLoading: groceriesLoading } = useQuery({
    queryKey: ['groceries'],
    queryFn: () => groceryService.getGroceries(),
  })

  const isLoading = insightsLoading || nutritionLoading || fitnessLoading || groceriesLoading

  if (isLoading) {
    return (
      <DashboardSkeleton />
    )
  }

  // ── Data derivations ──
  const todaysMeals = nutrition?.nutritionPlan?.meals || []
  const nextMeal =
    todaysMeals.find((m: any) => new Date(m.time) > new Date() || !m.time) || todaysMeals[0]

  const workoutPlan = fitness?.workoutPlan
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' })
  const todaysWorkout = workoutPlan?.sessions?.find(
    (s: any) => s.dayOfWeek === today || s.dayOfWeek === today.slice(0, 3)
  )
  const isRestDay = !todaysWorkout || todaysWorkout.name.toLowerCase().includes('rest')

  const totalMacros = todaysMeals.reduce(
    (acc: any, meal: any) => ({
      calories: acc.calories + (meal.macros?.calories || 0),
      protein: acc.protein + (meal.macros?.protein || 0),
      carbs: acc.carbs + (meal.macros?.carbs || 0),
      fat: acc.fat + (meal.macros?.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const calorieGoal = nutrition?.nutritionPlan?.targetMacros?.calories || 2200
  const proteinGoal = nutrition?.nutritionPlan?.targetMacros?.protein || 150
  const carbsGoal = nutrition?.nutritionPlan?.targetMacros?.carbs || 180
  const fatGoal = nutrition?.nutritionPlan?.targetMacros?.fat || 70

  const groceryTotal = groceries?.totalCount || 10
  const groceryDone = groceries?.purchasedCount || 6
  const groceryRemaining = groceryTotal - groceryDone
  const groceryPct = Math.round((groceryDone / groceryTotal) * 100)

  const streak = insights?.currentStreak || 5
  const personalBest = insights?.longestStreak || 12
  const points = insights?.totalPoints || 150
  const pointsToNext = insights?.pointsToNextBadge || 50
  const waterOz = insights?.estimatedWaterOz || 60
  const waterGoalOz = 84 // ~2.5L
  const sleepHours = insights?.estimatedSleepHours || 7.2
  const sleepGoal = 8
  const steps = insights?.estimatedSteps || 6420
  const stepsGoal = 10000

  // streak dots: Mon–Sun
  const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const todayIndex = getDayOfWeek() // 0 = Sun → shift to Mon-first
  const mondayFirst = [1, 2, 3, 4, 5, 6, 0] // Mon=1…Sun=0 in JS
  const currentMondayIdx = mondayFirst.indexOf(getDayOfWeek())

  const { user } = useAuth()
  return (
    <div className="space-y-5 pb-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400 font-medium">{formatDate()}</p>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-0.5 tracking-tight">
            {getGreeting()}, {user?.name || 'there'}! 🌟
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            You're on a{' '}
            <span className="text-orange-500 font-semibold inline-flex items-center gap-0.5">
              🔥 {streak}-day streak
            </span>
            . Keep it up!
          </p>
        </div>

        {/* AI Scan Meal CTA */}
        <button className="flex-shrink-0 flex items-center gap-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-3 rounded-2xl shadow-lg shadow-violet-200 transition-all hover:shadow-violet-300 hover:-translate-y-0.5 active:translate-y-0">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-[10px] text-violet-200 leading-none mb-0.5">AI-Powered</p>
            <p className="leading-none">Scan Meal</p>
          </div>
          <RefreshCw className="w-3.5 h-3.5 text-violet-300 ml-1" />
        </button>
      </div>

      {/* ── Streak Banner ── */}
      <div className="bg-white border-2 border-orange-400 rounded-2xl p-5 flex items-center gap-4">
        {/* Fire icon */}
        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 text-2xl">
          🔥
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-gray-900">{streak}</span>
            <span className="text-lg font-bold text-gray-700">Day Streak</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Personal Best:{' '}
            <span className="text-orange-500 font-semibold">{personalBest} days</span>
          </p>
          <p className="text-xs text-gray-400">Log one more meal to keep it alive!</p>
        </div>

        {/* Day dots */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {DAYS.map((day, i) => {
            const filled = i <= currentMondayIdx
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all
                    ${filled
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                      : 'bg-gray-100 text-gray-300'
                    }`}
                >
                  {filled && (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 font-medium">{day}</span>
              </div>
            )
          })}
        </div>

        {/* Rewards link */}
        <Link
          to="/dashboard/streaks"
          className="flex-shrink-0 flex items-center gap-1 text-orange-500 hover:text-orange-600 text-sm font-semibold ml-2 transition-colors"
        >
          Rewards <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ── Three metric cards: Water · Sleep · Steps ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Water */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Droplets className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-xs text-gray-400 font-medium">
              {(waterGoalOz * 0.0295735).toFixed(1)}L
            </span>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">
            {(waterOz * 0.0295735).toFixed(1)}L
          </p>
          <p className="text-xs text-gray-400 mb-3">Water</p>
          <ProgressBar value={waterOz} max={waterGoalOz} color="bg-blue-500" />
        </div>

        {/* Sleep */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Moon className="w-4 h-4 text-purple-500" />
            </div>
            <span className="text-xs text-gray-400 font-medium">{sleepGoal}h</span>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{sleepHours}h</p>
          <p className="text-xs text-gray-400 mb-3">Sleep</p>
          <ProgressBar value={sleepHours} max={sleepGoal} color="bg-purple-500" />
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-xs text-gray-400 font-medium">
              {(stepsGoal / 1000).toFixed(0)}K
            </span>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{steps.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mb-3">Steps</p>
          <ProgressBar value={steps} max={stepsGoal} color="bg-emerald-500" />
        </div>
      </div>

      {/* ── Nutrition Snapshot ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-lg">
              🍊
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Nutrition Snapshot</h3>
              <p className="text-xs text-gray-400">Daily macros progress</p>
            </div>
          </div>
          <Link
            to="/dashboard/nutrition"
            className="text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            Today →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {/* Calories */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                <span className="text-sm text-gray-600">Calories</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                <span className="font-bold">{totalMacros.calories}</span>
                <span className="text-gray-400 font-normal">/{calorieGoal}kcal</span>
              </span>
            </div>
            <ProgressBar value={totalMacros.calories} max={calorieGoal} color="bg-orange-500" />
          </div>

          {/* Protein */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="text-sm text-gray-600">Protein</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                <span className="font-bold">{totalMacros.protein}</span>
                <span className="text-gray-400 font-normal">/{proteinGoal}g</span>
              </span>
            </div>
            <ProgressBar value={totalMacros.protein} max={proteinGoal} color="bg-blue-500" />
          </div>

          {/* Carbs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="text-sm text-gray-600">Carbs</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                <span className="font-bold">{totalMacros.carbs}</span>
                <span className="text-gray-400 font-normal">/{carbsGoal}g</span>
              </span>
            </div>
            <ProgressBar value={totalMacros.carbs} max={carbsGoal} color="bg-emerald-500" />
          </div>

          {/* Fat */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                <span className="text-sm text-gray-600">Fat</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                <span className="font-bold">{totalMacros.fat}</span>
                <span className="text-gray-400 font-normal">/{fatGoal}g</span>
              </span>
            </div>
            <ProgressBar value={totalMacros.fat} max={fatGoal} color="bg-yellow-400" />
          </div>
        </div>
      </div>

      {/* ── Upcoming Meal + Next Workout ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Upcoming Meal */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Meal image area */}
          <div className="relative h-40 bg-gradient-to-br from-amber-100 to-orange-100 overflow-hidden">
            {nextMeal ? (
              <img
                src={"https://images.unsplash.com/photo-1529042410839-f73459aa5738?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
                alt={nextMeal.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl">🥗</div>
            )}
            {/* Overlay badges */}
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
              {nextMeal?.time && (
                <span className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold px-2.5 py-1.5 rounded-full shadow-sm">
                  🕐 {nextMeal.time}
                </span>
              )}
              {nextMeal?.macros?.calories && (
                <span className="flex items-center gap-1 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold px-2.5 py-1.5 rounded-full shadow-sm">
                  🔥 {nextMeal.macros.calories} kcal
                </span>
              )}
            </div>
          </div>

          {/* Meal info */}
          <div className="p-4">
            <p className="text-[10px] font-bold text-violet-600 tracking-widest uppercase flex items-center gap-1.5 mb-1">
              <UtensilsCrossed className="w-3 h-3" /> Upcoming Meal
            </p>
            <h3 className="text-base font-bold text-gray-900 mb-2">
              {nextMeal?.name || 'No meal planned'}
            </h3>
            {nextMeal?.macros && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                  P: {nextMeal.macros.protein}g
                </span>
                <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
                  C: {nextMeal.macros.carbs}g
                </span>
                <span className="text-xs text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded-full">
                  F: {nextMeal.macros.fat}g
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Next Workout */}
        <div className="rounded-2xl p-5 text-white relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 shadow-lg shadow-violet-200">
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-400/20 rounded-full blur-2xl translate-y-8 -translate-x-4" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-violet-200 uppercase tracking-wider">
                    Next Workout
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-extrabold mb-1">
              {isRestDay ? 'Rest Day 🧘' : todaysWorkout?.name || 'No workout'}
            </h3>
            <p className="text-violet-200 text-sm mb-4">
              {isRestDay ? 'Recovery is part of progress' : 'Tomorrow 7:00 AM'}
            </p>

            {!isRestDay && (
              <div className="flex items-center gap-2 flex-wrap mb-5">
                {todaysWorkout?.durationMin && (
                  <span className="flex items-center gap-1.5 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                    🕐 {todaysWorkout.durationMin} min
                  </span>
                )}
                <span className="flex items-center gap-1.5 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  ⚡ Medium
                </span>
                <span className="flex items-center gap-1.5 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  Cardio
                </span>
              </div>
            )}

            <Link
              to="/dashboard/fitness"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-violet-100 transition-colors"
            >
              View Routine <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Live Challenge · Grocery · Rewards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Live Challenge */}
        <Link
          to="/dashboard/community"
          className="relative rounded-2xl overflow-hidden min-h-[160px] group cursor-pointer shadow-sm"
        >
          {/* Background image placeholder */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900">
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <Users className="w-24 h-24 text-white" />
            </div>
          </div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          <div className="relative z-10 p-4 flex flex-col h-full justify-end min-h-[160px]">
            <span className="inline-flex items-center gap-1.5 text-yellow-400 text-[10px] font-bold tracking-wider uppercase mb-1.5">
              🏆 Live Challenge
            </span>
            <h3 className="text-white text-base font-extrabold leading-tight">Step Challenge</h3>
            <p className="text-gray-300 text-xs mt-1">You're in 2nd place! 🥈</p>
          </div>
        </Link>

        {/* Grocery */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase">
                Grocery
              </span>
            </div>
            <Link to="/dashboard/groceries">
              <ChevronRight className="w-4 h-4 text-gray-300 hover:text-gray-500 transition-colors" />
            </Link>
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Shopping List</h3>
          <p className="text-sm text-gray-500 mb-3">
            {groceryRemaining} items remaining this week
          </p>
          <ProgressBar value={groceryDone} max={groceryTotal} color="bg-emerald-500" />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">
              {groceryDone} of {groceryTotal} checked
            </span>
            <span className="text-xs font-bold text-emerald-600">{groceryPct}%</span>
          </div>
        </div>

        {/* Rewards */}
        <div className="rounded-2xl p-5 text-white relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-200">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-6 translate-x-6 blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-300" />
                <span className="text-xs font-bold tracking-wider uppercase text-orange-100">
                  Rewards
                </span>
              </div>
              <Link to="/dashboard/streaks">
                <ChevronRight className="w-4 h-4 text-orange-200 hover:text-white transition-colors" />
              </Link>
            </div>
            <p className="text-3xl font-extrabold mb-0.5">{points} pts</p>
            <p className="text-xs text-orange-100 mb-3 flex items-center gap-1">
              {pointsToNext} pts until next badge! ⚡
            </p>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, (points / (points + pointsToNext)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Daily Insight ── */}
      {!aiDismissed && (
        <div className="relative rounded-2xl bg-gradient-to-r from-slate-800 via-slate-800 to-indigo-900 text-white p-5 overflow-hidden shadow-lg">
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-violet-300" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-white">AI Daily Insight</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                You've maintained your protein intake above 85% for 4 consecutive days — excellent
                consistency! 🎯 Based on your goal, consider adding 200 more calories today from
                healthy fats (avocado, nuts) to fuel tomorrow's HIIT session. Your metabolism is
                primed.
              </p>
              <div className="flex items-center gap-1.5 mt-3">
                <Zap className="w-3 h-3 text-violet-400" />
                <span className="text-xs text-violet-400">
                  Powered by Njerka AI — updates daily based on your progress
                </span>
              </div>
            </div>

            <button
              onClick={() => setAiDismissed(true)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 self-start"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default InsightsPage