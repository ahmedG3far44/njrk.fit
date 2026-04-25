import { useState } from 'react'
import { 
  UtensilsCrossed, 
  Dumbbell, 
  Droplets, 
  Flame, 
  Clock, 
  Check, 
} from 'lucide-react'
import type { TimelineEvent } from '../services/schedule'

interface TimelineCardProps {
  event: TimelineEvent
  onToggle?: (id: string, isCompleted: boolean) => void
}

const EVENT_ICONS = {
  meal: UtensilsCrossed,
  workout: Dumbbell,
  water: Droplets,
}

const TimelineCard = ({ event, onToggle }: TimelineCardProps) => {
  const [localCompleted, setLocalCompleted] = useState(event.isCompleted)
  
  const isPending = !localCompleted

  const Icon = EVENT_ICONS[event.type] || UtensilsCrossed

  const handleToggle = () => {
    const newState = !localCompleted
    setLocalCompleted(newState)
    onToggle?.(event.id, newState)
  }

  const getMetadataText = () => {
    if (event.type === 'meal' && event.metadata) {
      const parts = []
      if (event.metadata.calories) parts.push(`${event.metadata.calories} kcal`)
      if (event.metadata.protein) parts.push(`P: ${event.metadata.protein}g`)
      if (event.metadata.carbs) parts.push(`C: ${event.metadata.carbs}g`)
      if (event.metadata.fat) parts.push(`F: ${event.metadata.fat}g`)
      return parts
    }
    if (event.type === 'workout' && event.metadata) {
      const parts = []
      if (event.metadata.durationMin) parts.push(`${event.metadata.durationMin} min`)
      if (event.metadata.exerciseType) parts.push(event.metadata.exerciseType)
      if (event.metadata.exerciseCount) parts.push(`${event.metadata.exerciseCount} exercises`)
      return parts
    }
    return []
  }

  const metadataText = getMetadataText()

  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center w-16 shrink-0">
        <span className="text-sm font-medium text-gray-600">{event.time}</span>
        <div className="relative">
          <div className={`w-3 h-3 rounded-full mt-1 ${
            localCompleted ? 'bg-purple-600' : 'border-2 border-gray-300'
          }`} />
        </div>
      </div>

      <div className={`flex-1 rounded-2xl p-4 border transition-all ${
        isPending 
          ? 'bg-white border-gray-100 shadow-sm hover:shadow-md' 
          : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isPending ? 'bg-purple-100' : 'bg-slate-200'
          }`}>
            {isPending ? (
              <Icon className="w-5 h-5 text-purple-600" />
            ) : (
              <Icon className="w-5 h-5 text-slate-500" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className={`font-medium ${!isPending && 'line-through text-gray-400'}`}>
              {event.title}
            </h4>

            {metadataText.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 mt-1">
                {event.type === 'meal' && event.metadata?.calories && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Flame className="w-3 h-3" />
                    <span>{event.metadata.calories} kcal</span>
                  </div>
                )}
                {event.type === 'workout' && event.metadata?.durationMin && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{event.metadata.durationMin} min</span>
                  </div>
                )}
                {metadataText.slice(1).map((text, i) => (
                  <span key={i} className="text-sm text-gray-500">{text}</span>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0">
            {isPending ? (
              <button
                onClick={handleToggle}
                className="px-4 py-2 text-purple-600 font-medium text-sm hover:bg-purple-50 rounded-lg transition-colors"
              >
                Mark Done
              </button>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="text-sm font-medium">Done</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimelineCard