import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { nutritionService } from '../services/nutrition'
import { X, ChefHat, Play, Sparkles, Send, RefreshCw, Flame, Clock } from 'lucide-react'

interface Ingredient {
  item: string
  amount: string
}

interface Instruction {
  step: number
  text: string
}

interface RefineMealProps {
  mealId: string
  mealName: string
  dayIndex: number
  mealDetails?: {
    name: string
    time: string
    calories: number
    protein: number
    carbs: number
    fat: number
    imageUrl?: string
    ingredients?: Ingredient[]
    instructions?: Instruction[]
  }
  onClose: () => void
  onRefined: () => void
}

const suggestionPills = [
  'Make it under 15 mins',
  "I don't have eggs today",
  'More protein',
  'Lower carb',
  'Vegan option',
  'Add breakfast meat'
]

const RefineMeal = ({ mealId, mealName, dayIndex, mealDetails, onClose, onRefined }: RefineMealProps) => {
  const [refinement, setRefinement] = useState('')
  const [refinedMeal, setRefinedMeal] = useState(mealDetails)
  const [isLoading, setIsLoading] = useState(false)

  const currentMeal = refinedMeal || {
    name: mealName,
    time: mealDetails?.time || '08:00 AM',
    calories: mealDetails?.calories || 0,
    protein: mealDetails?.protein || 0,
    carbs: mealDetails?.carbs || 0,
    fat: mealDetails?.fat || 0,
    imageUrl: mealDetails?.imageUrl,
    ingredients: mealDetails?.ingredients || [],
    instructions: mealDetails?.instructions || []
  }

  const mutation = useMutation({
    mutationFn: (data: { refinement: string; dayIndex: number; mealId: string }) =>
      nutritionService.refine(mealId, data),
    onSuccess: (response: any) => {
      if (response?.nutritionPlan?.meals) {
        const updatedMeal = response.nutritionPlan.meals.find((m: any) => m._id === mealId)
        if (updatedMeal) {
          setRefinedMeal(updatedMeal)
        }
      }
      setIsLoading(false)
      onRefined()
    },
    onError: () => {
      setIsLoading(false)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!refinement.trim()) return
    setIsLoading(true)
    mutation.mutate({ refinement, dayIndex, mealId })
  }

  const handleSuggestion = (suggestion: string) => {
    setRefinement(suggestion)
  }

  const handleRegenerate = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 2000)
  }

  const isLoadingState = isLoading || mutation.isPending

  const formatIngredient = (ing: any, index: number) => {
    if (typeof ing === 'string') return ing
    return ing?.item || ing?.amount || `Ingredient ${index + 1}`
  }

  const formatInstruction = (inst: any, index: number) => {
    if (typeof inst === 'string') return inst
    return inst?.text || inst?.instruction || `Step ${index + 1}`
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-4xl max-h-[90vh] shadow-2xl grid grid-cols-1 md:grid-cols-2">
        {/* Left Column - Image & Hero */}
        <div className="relative h-64 md:h-auto">
          {currentMeal.imageUrl ? (
            <img
              src={currentMeal.imageUrl}
              alt={currentMeal.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-purple-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-2xl font-bold text-white mb-2">
              {currentMeal.name}
            </h2>
            <div className="flex items-center gap-4 text-white/80 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{currentMeal.time}</span>
              </div>
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4" />
                <span>{currentMeal.calories} kcal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="p-6 overflow-y-auto max-h-[90vh]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 md:hidden"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Macros Row */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-blue-600">{currentMeal.protein}g</p>
              <p className="text-xs text-blue-500 font-medium">Protein</p>
            </div>
            <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-green-600">{currentMeal.carbs}g</p>
              <p className="text-xs text-green-500 font-medium">Carbs</p>
            </div>
            <div className="flex-1 bg-orange-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-orange-600">{currentMeal.fat}g</p>
              <p className="text-xs text-orange-500 font-medium">Fat</p>
            </div>
          </div>

          {/* Ingredients */}
          <div className="mb-6">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
              <ChefHat className="w-5 h-5 text-purple-600" />
              Ingredients
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {currentMeal.ingredients && currentMeal.ingredients.length > 0 ? (
                currentMeal.ingredients.map((ing: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 bg-purple-300 rounded-full" />
                    {formatIngredient(ing, i)}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 col-span-2">No ingredients listed</p>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-6">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
              <Play className="w-5 h-5 text-purple-600" />
              Instructions
            </h3>
            <div className="space-y-2">
              {currentMeal.instructions && currentMeal.instructions.length > 0 ? (
                currentMeal.instructions.map((inst: any, i: number) => (
                  <div key={i} className="flex gap-3 text-sm text-gray-600">
                    <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {i + 1}
                    </span>
                    {formatInstruction(inst, i)}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">No instructions listed</p>
              )}
            </div>
          </div>

          {/* AI Refinement */}
          <div className="border-t pt-4">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-1">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Refine with AI
            </h3>
            <p className="text-xs text-gray-500 mb-3">Tell AI how to modify this meal</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {suggestionPills.map((pill, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestion(pill)}
                  className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-700 hover:border-purple-300 hover:text-purple-600 transition-colors"
                >
                  {pill}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
              <input
                type="text"
                value={refinement}
                onChange={(e) => setRefinement(e.target.value)}
                placeholder="e.g. Make it vegan..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={isLoadingState || !refinement.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
              >
                {isLoadingState ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>

            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isLoadingState}
              className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-purple-300 hover:text-purple-600 flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate this Meal (AI Surprise)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RefineMeal