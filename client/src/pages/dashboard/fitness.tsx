import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fitnessService } from '../../services/fitness'
import { Target, Clock, Flame, Zap, CheckCircle } from 'lucide-react'

import GenerateWorkout from '../../components/GenerateWorkout'
import RoutineModal from '../../components/RoutineModal'

type SessionFilter = 'All' | 'Strength' | 'Cardio' | 'Yoga' | 'Recovery'
type WorkoutSession = any

const FitnessPage = () => {
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null)
  const [showRoutineModal, setShowRoutineModal] = useState(false)
  const [filter, setFilter] = useState<SessionFilter>('All')

  const { data: apiData, isLoading, refetch } = useQuery({
    queryKey: ['fitness'],
    queryFn: () => fitnessService.getCurrent(),
  })

  const workoutPlan = apiData?.workoutPlan

  const filteredSessions = useMemo(() => {
    if (!workoutPlan?.sessions) return []
    if (filter === 'All') return workoutPlan.sessions
    return workoutPlan.sessions.filter(s => s.type === filter)
  }, [workoutPlan, filter])

  const todaySession = useMemo(() => {
    if (!workoutPlan?.sessions) return null
    const today = new Date().toLocaleDateString('en-US', { weekday: 'short' })
    return workoutPlan.sessions.find(s => s.dayOfWeek === today.slice(0, 3)) || workoutPlan.sessions[0]
  }, [workoutPlan])

  const totalCalories = workoutPlan?.sessions?.reduce((acc, s) => acc + s.estimatedCaloriesBurn, 0) || 0
  const totalMinutes = workoutPlan?.sessions?.reduce((acc, s) => acc + s.durationMin, 0) || 0

  const handleViewRoutine = (session: WorkoutSession) => {
    setSelectedSession(session)
    setShowRoutineModal(true)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-40" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-64" />
        <div className="flex gap-2 mt-4">
          <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse mb-3" />
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
            </div>
          ))}
        </div>
        <div className="h-40 bg-gray-200 rounded animate-pulse mt-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (workoutPlan?.sessions.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Fitness Hub</h1>
            <p className="text-gray-500 text-sm mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Generate AI Plan
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fitness Hub</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
        >
          <Zap className="w-4 h-4" />
          Generate AI Plan
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{workoutPlan?.sessionsCompleted || 0}</p>
            <p className="text-sm text-gray-500">Sessions Done</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
            <Flame className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalCalories}</p>
            <p className="text-sm text-gray-500">Calories Burned</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
            <Clock className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalMinutes}</p>
            <p className="text-sm text-gray-500">Active Minutes</p>
          </div>
        </div>
      </div>

      {!workoutPlan ? (
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-12 text-center">
          <Target className="w-16 h-16 text-white mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Fitness Plan Yet</h2>
          <p className="text-purple-100 mb-6">
            Build a personalized AI-powered workout plan tailored to your goals
          </p>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-6 py-3 bg-white text-purple-700 rounded-xl font-medium hover:bg-purple-50"
          >
            Build My AI Plan →
          </button>
        </div>
      ) : todaySession && (
        <div className="relative rounded-2xl overflow-hidden h-64">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-600">
            <div className="w-full h-full opacity-30 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a2e?w=800')] bg-cover bg-center" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 bg-gray-900/80 text-white text-sm rounded-full">High Intensity</span>
          </div>

          <div className="absolute bottom-6 left-6">
            <span className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full">TODAY'S SESSION</span>
            <h2 className="text-3xl font-bold text-white mt-2">{todaySession.name}</h2>
            <div className="flex items-center gap-4 mt-2 text-gray-200">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {todaySession.durationMin} min
              </span>
              <span className="flex items-center gap-1">
                <Flame className="w-4 h-4" />
                {todaySession.estimatedCaloriesBurn} kcal
              </span>
              <span>{todaySession.exercises?.length || 0} exercises</span>
            </div>
            <button
              onClick={() => handleViewRoutine(todaySession)}
              className="mt-4 px-6 py-2 bg-white text-gray-900 rounded-xl font-medium hover:bg-gray-100"
            >
              View Routine
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Coming Up This Week</h3>
              <div className="flex items-center gap-2">
                {(['All', 'Strength', 'Cardio', 'Yoga', 'Recovery'] as SessionFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${filter === f
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredSessions.map((session) => (
                <div
                  key={session._id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${session.isCompleted
                      ? 'bg-green-100 text-green-600'
                      : session.type === 'Strength'
                        ? 'bg-blue-100 text-blue-600'
                        : session.type === 'Cardio'
                          ? 'bg-orange-100 text-orange-600'
                          : session.type === 'Yoga'
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                      {session.isCompleted ? <CheckCircle className="w-5 h-5" /> : session.dayOfWeek.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium">{session.name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{session.durationMin} min</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${session.type === 'Strength'
                          ? 'bg-blue-100 text-blue-700'
                          : session.type === 'Cardio'
                            ? 'bg-orange-100 text-orange-700'
                            : session.type === 'Yoga'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                          {session.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewRoutine(session)}
                    className="px-4 py-2 text-purple-600 font-medium hover:bg-purple-50 rounded-lg"
                  >
                    View Routine
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-4">
          <div className="bg-purple-600 rounded-xl p-6 text-white h-full">
            <h3 className="font-semibold mb-4">Weekly Goal</h3>
            <p className="text-4xl font-bold">
              {workoutPlan?.sessionsCompleted || 0} / {workoutPlan?.sessions?.length || 0}
            </p>
            <p className="text-sm text-purple-200 mb-4">sessions</p>

            <div className="w-full h-2 bg-purple-800 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{
                  width: `${workoutPlan?.sessions?.length ? (workoutPlan.sessionsCompleted / workoutPlan.sessions.length) * 100 : 0}%`
                }}
              />
            </div>

            <div className="grid grid-cols-7 gap-1">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                const sessionIdx = i < (workoutPlan?.sessions?.length || 0) ? i : -1
                const isCompleted = sessionIdx >= 0 && workoutPlan?.sessions?.[sessionIdx]?.isCompleted
                return (
                  <div key={i} className="text-center">
                    <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${isCompleted ? 'bg-white text-purple-600' : 'bg-purple-800/50'
                      }`}>
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : ''}
                    </div>
                    <span className="text-xs">{day}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {showGenerateModal && (
        <GenerateWorkout
          onClose={() => setShowGenerateModal(false)}
          onGenerated={() => {
            setShowGenerateModal(false)
            refetch()
          }}
        />
      )}

      {showRoutineModal && selectedSession && (
        <RoutineModal
          session={selectedSession}
          onClose={() => {
            setShowRoutineModal(false)
            setSelectedSession(null)
          }}
        />
      )}
    </div>
  )
}

export default FitnessPage