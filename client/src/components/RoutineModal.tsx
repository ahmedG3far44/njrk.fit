import { Clock, Flame, X } from 'lucide-react'

interface Exercise {
  name: string
  sets: number
  reps: string
  restTime?: string
  isCompleted?: boolean
}

interface WorkoutSession {
  _id: string
  dayOfWeek: string
  name: string
  type: string
  durationMin: number
  estimatedCaloriesBurn: number
  exercises: Exercise[]
}

interface RoutineModalProps {
  session: WorkoutSession
  onClose: () => void
}

const RoutineModal = ({ session, onClose }: RoutineModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="bg-gray-900 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 text-sm">{session.dayOfWeek}</p>
              <h2 className="text-xl font-bold">{session.name}</h2>
              <div className="flex items-center gap-4 mt-2 text-gray-300 text-sm">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {session.durationMin} min
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="w-4 h-4" />
                  {session.estimatedCaloriesBurn} cal
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-3">
            {session.exercises?.map((exercise, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-medium">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{exercise.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-purple-600 font-bold">{exercise.sets}</p>
                    <p className="text-xs text-gray-500">SETS</p>
                  </div>
                  <div className="text-center">
                    <p className="text-purple-600">{exercise.reps}</p>
                    <p className="text-xs text-gray-500">REPS</p>
                  </div>
                  <div className="text-center">
                    <p className="text-orange-600">{exercise.restTime || '60s'}</p>
                    <p className="text-xs text-gray-500">REST</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoutineModal