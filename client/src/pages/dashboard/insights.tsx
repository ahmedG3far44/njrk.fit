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
  Footprints,
  Moon,
  Droplets,
  ShoppingCart,
  Trophy,
  ArrowRight,
  Loader2,
  Sparkles,
  Clock,
} from 'lucide-react'

const InsightsPage = () => {
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  const todaysMeals = nutrition?.nutritionPlan?.meals || []
  const nextMeal = todaysMeals.find(
    (m) => new Date(m.time) > new Date() || !m.time
  ) || todaysMeals[0]

  const workoutPlan = fitness?.workoutPlan
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' })
  const todaysWorkout = workoutPlan?.sessions?.find(
    (s) => s.dayOfWeek === today || s.dayOfWeek === today.slice(0, 3)
  )
  const isRestDay = !todaysWorkout || todaysWorkout.name.toLowerCase().includes('rest')

  const totalMacros = todaysMeals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.macros?.calories || 0),
      protein: acc.protein + (meal.macros?.protein || 0),
      carbs: acc.carbs + (meal.macros?.carbs || 0),
      fat: acc.fat + (meal.macros?.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const groceryCount = groceries ? groceries.totalCount - groceries.purchasedCount : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Today's Insights</h1>
        <Link
          to="/dashboard/schedule"
          className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          View Schedule
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-sm text-gray-500">Streak</span>
          </div>
          <p className="text-3xl font-bold">{insights?.currentStreak || 0}</p>
          <p className="text-xs text-gray-400">days</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-sm text-gray-500">Points</span>
          </div>
          <p className="text-3xl font-bold">{insights?.pointsToRedeem || 0}</p>
          <p className="text-xs text-gray-400">to redeem</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Footprints className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-sm text-gray-500">Steps</span>
          </div>
          <p className="text-3xl font-bold">{(insights?.estimatedSteps || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400">estimated</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-cyan-500" />
            </div>
            <span className="text-sm text-gray-500">Water</span>
          </div>
          <p className="text-3xl font-bold">{insights?.estimatedWaterOz || 0}</p>
          <p className="text-xs text-gray-400">oz estimated</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <div>
                <p className="text-emerald-100 text-sm">Next Meal</p>
                <h3 className="text-xl font-bold">{nextMeal?.name || 'No meal planned'}</h3>
              </div>
            </div>
            {nextMeal?.time && (
              <div className="flex items-center gap-1 text-emerald-100 text-sm">
                <Clock className="w-4 h-4" />
                {nextMeal.time}
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{totalMacros.calories}</p>
              <p className="text-xs text-emerald-100">Calories</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{totalMacros.protein}g</p>
              <p className="text-xs text-emerald-100">Protein</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{totalMacros.carbs}g</p>
              <p className="text-xs text-emerald-100">Carbs</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{totalMacros.fat}g</p>
              <p className="text-xs text-emerald-100">Fat</p>
            </div>
          </div>

          <Link
            to="/dashboard/nutrition"
            className="flex items-center justify-center gap-2 mt-4 w-full py-2 bg-white/20 rounded-xl text-sm font-medium hover:bg-white/30 transition-colors"
          >
            View Nutrition Plan
          </Link>
        </div>

        <div className={`rounded-2xl p-6 text-white ${isRestDay ? 'bg-gradient-to-br from-slate-600 to-slate-700' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div>
                <p className="text-blue-100 text-sm">Workout</p>
                <h3 className="text-xl font-bold">
                  {isRestDay ? 'Rest Day' : todaysWorkout?.name || 'No workout'}
                </h3>
              </div>
            </div>
            {!isRestDay && todaysWorkout && (
              <div className="text-right">
                <p className="text-2xl font-bold">{todaysWorkout.durationMin}</p>
                <p className="text-xs text-blue-100">minutes</p>
              </div>
            )}
          </div>

          {!isRestDay && todaysWorkout?.exercises?.length ? (
            <div className="space-y-2 mb-4">
              {todaysWorkout.exercises.slice(0, 3).map((ex, i) => (
                <div key={i} className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium truncate">{ex.name}</span>
                  <span className="text-sm text-blue-100">
                    {ex.sets}x{ex.reps}
                  </span>
                </div>
              ))}
              {todaysWorkout.exercises.length > 3 && (
                <p className="text-xs text-blue-100 text-center">
                  +{todaysWorkout.exercises.length - 3} more exercises
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-4 text-blue-100">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Take a rest day today!</span>
            </div>
          )}

          <Link
            to="/dashboard/fitness"
            className="flex items-center justify-center gap-2 mt-auto w-full py-2 bg-white/20 rounded-xl text-sm font-medium hover:bg-white/30 transition-colors"
          >
            View Workout Plan
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Link
          to="/dashboard/groceries"
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <ShoppingCart className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold">Grocery List</h3>
          </div>
          <p className="text-gray-500 text-sm">
            {groceryCount > 0 ? (
              <>
                <span className="font-bold text-gray-900">{groceryCount}</span> items to buy
              </>
            ) : (
              'No items in list'
            )}
          </p>
          <div className="flex items-center text-green-600 text-sm mt-2 group-hover:translate-x-1 transition-transform">
            <span>View list</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Moon className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="font-semibold">Sleep</h3>
          </div>
          <p className="text-gray-900">
            <span className="text-3xl font-bold">{insights?.estimatedSleepHours || 7.5}</span>
            <span className="text-gray-500 text-sm ml-1">hours</span>
          </p>
          <p className="text-gray-400 text-xs mt-1">recommended</p>
        </div>

        <Link
          to="/dashboard/streaks"
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
              <Trophy className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-semibold">Rewards</h3>
          </div>
          <p className="text-gray-500 text-sm">
            <span className="font-bold text-gray-900 text-lg">{insights?.totalPoints || 0}</span> total points
          </p>
          <div className="flex items-center text-orange-600 text-sm mt-2 group-hover:translate-x-1 transition-transform">
            <span>View rewards</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </div>
  )
}

export default InsightsPage