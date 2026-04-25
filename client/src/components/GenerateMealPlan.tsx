import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { nutritionService } from '../services/nutrition'
import { useAuth } from '../contexts/AuthContext'
import { X } from 'lucide-react'

interface GenerateMealPlanProps {
  targetUserId?: string
  onClose: () => void
  onGenerated: () => void
}

const GenerateMealPlan = ({ targetUserId, onClose, onGenerated }: GenerateMealPlanProps) => {
  const { user } = useAuth()
  const [calories, setCalories] = useState(user?.weight ? Math.round(user.weight * 24 * 1.2) : 2000)
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0])

  const mutation = useMutation({
    mutationFn: (data: { calories: number; startDate: string }) =>
      nutritionService.generate(data, targetUserId),
    onSuccess: () => {
      onGenerated()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({ calories, startDate })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Generate Meal Plan</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Daily Calories</label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              min={1200}
              max={5000}
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Recommended: {Math.round((user?.weight || 70) * 24 * 1.2)} cal based on your weight
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GenerateMealPlan