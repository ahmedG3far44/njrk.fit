import { Flame, UtensilsCrossed, Dumbbell } from 'lucide-react'

interface MealCardProps {
  id?: string
  name: string
  day: string
  time: string
  type: 'meal' | 'workout'
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  forUser?: string
  imageUrl?: string
  completed?: boolean
  onSwap?: () => void
  onRefine?: () => void
}

const MealCard = ({
  id,
  name,
  day,
  time,
  type,
  calories,
  protein,
  carbs,
  fat,
  forUser = 'You',
  imageUrl,
  onSwap,
  onRefine,
}: MealCardProps) => {
  
  console.log(id, name,)
  const isMeal = type === 'meal'
  const badgeColor = isMeal ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
  const badgeText = isMeal ? day : (time.includes('min') ? time : `${time} min`)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex">
        <div className="w-24 h-24 bg-gray-100 relative shrink-0">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {isMeal ? (
                <UtensilsCrossed className="w-8 h-8 text-gray-300" />
              ) : (
                <Dumbbell className="w-8 h-8 text-gray-300" />
              )}
            </div>
          )}
          <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-xs font-medium ${badgeColor}`}>
            {isMeal ? day : badgeText}
          </div>
        </div>

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  forUser === 'You' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {forUser}
                </span>
              </div>
              <h3 className="font-medium text-gray-900 truncate">{name}</h3>
              
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                {isMeal && calories && (
                  <div className="flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    <span>{calories} cal</span>
                  </div>
                )}
                {isMeal && (
                  <span>P: {protein}g</span>
                )}
                {isMeal && (
                  <span>C: {carbs}g</span>
                )}
                {isMeal && (
                  <span>F: {fat}g</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onRefine}
                className="px-3 py-1.5 text-emerald-600 text-sm font-medium hover:bg-emerald-50 rounded-lg transition-colors"
              >
                Refine
              </button>
              <button
                onClick={onSwap}
                className="px-3 py-1.5 text-purple-600 text-sm font-medium hover:bg-purple-50 rounded-lg transition-colors"
              >
                Swap
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MealCard