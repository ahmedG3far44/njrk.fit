import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { nutritionService } from '../../services/nutrition'
import { familyService } from '../../services/family'
import { useAuth } from '../../contexts/AuthContext'
import { UtensilsCrossed, Loader2, Sparkles, User, Users } from 'lucide-react'


import RefineMeal from '../../components/RefineMeal'
import MacroCard from '../../components/MacroCard'
import MealCard from '../../components/MealCard'
import AddMemberModal from '../../components/AddMemberModal'

type ViewMode = 'solo' | 'family'
type TimeRange = 'day' | 'week'

interface FamilyMember {
  id: string
  name: string
  avatarUrl?: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const NutritionPage = () => {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('family')
  const [timeRange] = useState<TimeRange>('day')
  const [showRefineModal, setShowRefineModal] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<any>(null)
  const [activeProfileId, setActiveProfileId] = useState<string | null>(user?._id || '')
  const [isGenerating, setIsGenerating] = useState(false)
  const [date] = useState(() => new Date().toISOString().split('T')[0])
  const [refetch, setRefetch] = useState(0)

  const today = new Date()
  const todayDayName = DAYS[today.getDay() === 0 ? 6 : today.getDay() - 1]

  const { data: familyData } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyService.getFamily(),
    enabled: viewMode === 'family',
  })

  const familyMembers: FamilyMember[] = useMemo(() => {
    if (!familyData?.familyMembers) return [{ id: user?._id || '', name: user?.name || 'You' }]
    return [
      { id: user?._id || '', name: user?.name || 'You' },
      ...familyData.familyMembers.map(m => ({ id: m.id, name: m.name, avatarUrl: m.avatarUrl || undefined }))
    ]
  }, [familyData])

  const { data: nutritionData, isLoading } = useQuery({
    queryKey: ['nutrition', date, activeProfileId, refetch],
    queryFn: () => nutritionService.getCurrentForUser(),
  })

  const { data: weekData } = useQuery({
    queryKey: ['nutrition-week', activeProfileId, refetch],
    queryFn: () => nutritionService.getWeek(),
  })

  const plan = nutritionData?.nutritionPlan
  const weekPlan = weekData?.nutritionPlans?.[0]

  const todayMeals = useMemo(() => {
    if (!plan?.meals) return []
    return plan.meals.filter(m => m.day === todayDayName)
  }, [plan, todayDayName])

  const mealsByDay = useMemo(() => {
    if (!weekPlan?.meals) return {}
    const grouped: Record<string, typeof weekPlan.meals> = {}
    for (const day of DAYS) {
      grouped[day] = weekPlan.meals.filter(m => m.day === day)
    }
    return grouped
  }, [weekPlan])

  const activeProfile = familyMembers.find(m => m.id === (activeProfileId || 'user-123'))

  console.log(activeProfile)

  const targetCalories = plan?.targetMacros?.calories || 2000

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setRefetch(prev => prev + 1)
    }, 2000)
  }

  const handleRefine = (meal: any) => {
    setSelectedMeal(meal)
    setShowRefineModal(true)
  }

  const handleSwap = (mealId: string) => {
    console.log('Swap meal:', mealId)
  }

  const isPremium = user?.subscriptionTier === 'PRO' || user?.subscriptionTier === 'FAMILY'

  console.log("IS Premium", isPremium)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nutrition Plan</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-3">

          <div className="text-xs font-bold px-2 py-1  flex items-center gap-2">
            {
              viewMode === 'solo' ? (
                <button className='cursor-pointer hover:bg-violet-100 duration-300 p-2 rounded-2xl' onClick={() => setViewMode('family')}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-violet-600" />
                    </div> <span>Family Mode</span>
                  </div>

                </button>
              ) : (
                <button className='cursor-pointer hover:bg-violet-100 duration-300 p-2 rounded-2xl' onClick={() => setViewMode('solo')}>
                  <div className='flex items-center gap-2'>
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-violet-600" />
                    </div> <span>Solo Mode</span>
                  </div>
                </button>
              )
            }

          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate</span>
              </>
            )}
          </button>


        </div>
      </div>

      {viewMode === 'family' && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {familyMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => setActiveProfileId(member.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-full border shrink-0 transition-all ${member.id === activeProfileId
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-purple-200'
                }`}
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                {
                  member.avatarUrl ? (
                    <img src={member.avatarUrl} alt="avatar" className="w-full h-full rounded-full" />
                  ) : (
                    <span className="text-gray-600 font-medium text-sm">
                      {member.name.charAt(0)}
                    </span>
                  )
                }
              </div>
              <span className="text-sm font-medium">{member.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <MacroCard
          label="Calories"
          current={timeRange === 'week' ? 0 : (targetCalories * 0.3)}
          target={targetCalories}
          color="orange"
        />
        <MacroCard
          label="Protein"
          current={plan?.targetMacros?.protein || 0}
          target={plan?.targetMacros?.protein || 150}
          unit="g"
          color="red"
        />
        <MacroCard
          label="Carbs"
          current={plan?.targetMacros?.carbs || 0}
          target={plan?.targetMacros?.carbs || 200}
          unit="g"
          color="amber"
        />
        <MacroCard
          label="Fat"
          current={plan?.targetMacros?.fat || 0}
          target={plan?.targetMacros?.fat || 65}
          unit="g"
          color="yellow"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : timeRange === 'day' ? (
        todayMeals.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              {todayDayName}'s Meals
            </h3>
            <>
              {
                todayMeals.length > 0 ?
                  (todayMeals?.map((meal) => (
                    <MealCard
                      key={meal._id}
                      id={meal._id}
                      name={meal.name}
                      day={meal.day}
                      time={meal.time}
                      type="meal"
                      calories={meal.macros.calories}
                      protein={meal.macros.protein}
                      carbs={meal.macros.carbs}
                      fat={meal.macros.fat}
                      forUser={(meal as any).forUser || 'You'}
                      imageUrl={meal.imageUrl}
                      onSwap={() => handleSwap(meal.name)}
                      onRefine={() => handleRefine(meal)}
                    />
                  ))) : (
                    <>
                    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No meals scheduled for today</p>
            <p className="text-gray-400 text-sm mt-1 mb-6">
              Generate a meal plan to get started
            </p>
            <button
              onClick={handleGenerate}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700"
            >
              Generate Plan
            </button>
          </div>
                    </>
                  )}
            </>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No meals scheduled for today</p>
            <p className="text-gray-400 text-sm mt-1 mb-6">
              Generate a meal plan to get started
            </p>
            <button
              onClick={handleGenerate}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700"
            >
              Generate Plan
            </button>
          </div>
        )
      ) : (
        <div className="space-y-6">
          {DAYS.map((day) => {
            const dayMeals = mealsByDay[day] || []
            if (dayMeals.length === 0) return null
            return (
              <div key={day} className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-700">{day}</h3>
                {dayMeals.map((meal) => (
                  <MealCard
                    key={meal._id}
                    id={meal._id}
                    name={meal.name}
                    day={meal.day}
                    time={meal.time}
                    type="meal"
                    calories={meal.macros.calories}
                    protein={meal.macros.protein}
                    carbs={meal.macros.carbs}
                    fat={meal.macros.fat}
                    forUser={(meal as any).forUser}
                    imageUrl={meal.imageUrl}
                    onSwap={() => handleSwap(meal.name)}
                    onRefine={() => handleRefine(meal)}
                  />
                ))}
              </div>
            )
          })}
        </div>
      )}

      {showRefineModal && selectedMeal && (
        <RefineMeal
          mealId={selectedMeal._id}
          mealName={selectedMeal.name}
          dayIndex={0}
          mealDetails={{
            name: selectedMeal.name,
            time: selectedMeal.time || '08:00 AM',
            calories: selectedMeal.macros?.calories || selectedMeal.calories || 0,
            protein: selectedMeal.macros?.protein || selectedMeal.protein || 0,
            carbs: selectedMeal.macros?.carbs || selectedMeal.carbs || 0,
            fat: selectedMeal.macros?.fat || selectedMeal.fat || 0,
            imageUrl: selectedMeal.imageUrl,
            ingredients: selectedMeal.ingredients || [],
            instructions: selectedMeal.instructions || []
          }}
          onClose={() => {
            setShowRefineModal(false)
            setSelectedMeal(null)
          }}
          onRefined={() => {
            setShowRefineModal(false)
            setSelectedMeal(null)
            setRefetch(prev => prev + 1)
          }}
        />
      )}

      {showAddMember && (
        <AddMemberModal
          onClose={() => setShowAddMember(false)}
          onInvited={() => setRefetch(prev => prev + 1)}
        />
      )}
    </div>
  )
}

export default NutritionPage