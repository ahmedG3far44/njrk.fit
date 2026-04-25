import { useMutation } from '@tanstack/react-query'
import { fitnessService } from '../services/fitness'
import { X, CheckCircle } from 'lucide-react'

interface CompleteSessionProps {
  sessionId: string
  onClose: () => void
  onCompleted: () => void
}

const CompleteSession = ({ sessionId, onClose, onCompleted }: CompleteSessionProps) => {

  const mutation = useMutation({
    mutationFn: (data?: { exerciseIndices?: number[] }) =>
      fitnessService.completeSession(sessionId, data),
    onSuccess: () => {
      onCompleted()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({})
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Complete Session</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="text-center py-4">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Great work!</p>
            <p className="text-sm text-gray-500 mt-1">
              Mark this session as complete
            </p>
          </div>

          <p className="text-sm text-gray-500">
            Optionally, you can mark specific exercises as completed:
          </p>

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
              {mutation.isPending ? 'Completing...' : 'Complete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CompleteSession