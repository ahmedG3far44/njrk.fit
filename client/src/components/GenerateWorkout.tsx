import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { fitnessService } from '../services/fitness'
import { useAuth } from '../contexts/AuthContext'
import { 
  X, 
  Dumbbell, 
  Timer, 
  Calendar, 
  Zap,
  CheckCircle2,
  Sparkles,
  ChevronRight
} from 'lucide-react'

interface GenerateWorkoutProps {
  onClose: () => void
  onGenerated: () => void
}

const EQUIPMENT_OPTIONS = [
  { id: 'dumbbells', name: 'Dumbbells', icon: '💪', desc: 'Adjustable weight training' },
  { id: 'barbell', name: 'Barbell', icon: '🏋️', desc: 'Classic strength training' },
  { id: 'kettlebell', name: 'Kettlebell', icon: '⚫', desc: 'Dynamic swing movements' },
  { id: 'resistance-bands', name: 'Resistance Bands', icon: '〰️', desc: 'Portable flexibility' },
  { id: 'pull-up-bar', name: 'Pull-up Bar', icon: '单', desc: 'Upper body strength' },
  { id: 'bench', name: 'Weight Bench', icon: '🪑', desc: 'Decline/incline pressing' },
]

const DURATION_PRESETS = [
  { value: 30, label: '30 min', desc: 'Quick Burn' },
  { value: 45, label: '45 min', desc: 'Standard' },
  { value: 60, label: '60 min', desc: 'Full Session' },
  { value: 75, label: '75 min', desc: 'Deep Work' },
  { value: 90, label: '90 min', desc: 'Endurance' },
]

const GenerateWorkout = ({ onClose, onGenerated }: GenerateWorkoutProps) => {
  const { user } = useAuth()
  const [duration, setDuration] = useState(60)
  const [equipment, setEquipment] = useState<string[]>(user?.equipment || ['dumbbells'])
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0])

  // const allEquipment = EQUIPMENT_OPTIONS.map(e => e.id)

  const mutation = useMutation({
    mutationFn: (data: { duration: number; equipment: string[]; startDate: string }) =>
      fitnessService.generate(data),
    onSuccess: () => {
      onGenerated()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({ duration, equipment, startDate })
  }

  const toggleEquipment = (item: string) => {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    )
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-b border-slate-800">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Generate Workout</h2>
                <p className="text-xs text-slate-400">AI-powered personalized plan</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Duration Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-300">
              <Timer className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium">Session Duration</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setDuration(preset.value)}
                  className={`group relative flex flex-col items-center py-3 px-2 rounded-xl border transition-all duration-200 ${
                    duration === preset.value
                      ? 'border-emerald-500 bg-emerald-500/10 text-white'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  <span className={`font-bold text-sm ${duration === preset.value ? 'text-emerald-400' : ''}`}>
                    {preset.label}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">{preset.desc}</span>
                  {duration === preset.value && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-300">
              <Dumbbell className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium">Equipment Available</span>
              <span className="text-xs text-slate-500 ml-auto">{equipment.length} selected</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {EQUIPMENT_OPTIONS.map((item) => {
                const isSelected = equipment.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleEquipment(item.id)}
                    className={`group relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">{item.desc}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'border-cyan-500 bg-cyan-500' 
                        : 'border-slate-600 group-hover:border-slate-500'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-slate-900" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Start Date Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium">Start Date</span>
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
              required
            />
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between py-3 px-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm">Plan Summary</span>
            </div>
            <div className="text-sm">
              <span className="text-white font-medium">{duration} min</span>
              <span className="text-slate-500"> · </span>
              <span className="text-slate-400">{equipment.length} equipment</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || equipment.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-emerald-500/20"
            >
              {mutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Plan</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GenerateWorkout