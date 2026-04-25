import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { gamificationService } from '../../services/gamification'
import type { Reward } from '../../services/gamification'
import {
  Flame,
  Snowflake,
  Trophy,
  Loader2,
  Check,
  Lock,
  Shield,
  ChevronRight,
  Calendar,
  Award,
  Zap,
  Star,
  Medal,
  Crown,
} from 'lucide-react'

const STREAK_MESSAGES: Record<number, string> = {
  0: "Ready to start your journey?",
  1: "Great start! Keep it going!",
  2: "You're building momentum!",
  3: "Three days strong!",
  4: "Almost at a week!",
  5: "You're unstoppable!",
  6: "One more day to a reward!",
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const BADGE_ICONS: Record<string, React.ElementType> = {
  shield: Shield,
  medal: Medal,
  trophy: Trophy,
  crown: Crown,
  star: Star,
}

const StreaksPage = () => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'rewards'>('calendar')
  const [currentMonth, setCurrentMonth] = useState(() => new Date())

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['gamification'],
    queryFn: gamificationService.getStatus,
  })

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ['activity', currentMonth.getMonth(), currentMonth.getFullYear()],
    queryFn: () => gamificationService.getActivity(
      currentMonth.getMonth(), 
      currentMonth.getFullYear()
    ),
  })

  const { data: rewardsData, isLoading: rewardsLoading } = useQuery({
    queryKey: ['rewards'],
    queryFn: gamificationService.getRewards,
  })

  const checkInMutation = useMutation({
    mutationFn: gamificationService.checkIn,
    onSuccess: () => {
      refetch()
    },
  })

  const freezeMutation = useMutation({
    mutationFn: gamificationService.freeze,
    onSuccess: () => {
      refetch()
    },
  })

  const claimMutation = useMutation({
    mutationFn: ({ rewardId }: { rewardId: string }) => 
      gamificationService.claimReward(rewardId),
    onSuccess: () => {
      refetch()
    },
  })

  const refetch = () => {
    window.location.reload()
  }

  const handleCheckIn = () => {
    checkInMutation.mutate()
  }

  const handleFreeze = () => {
    if (status?.availableFreezes && status.availableFreezes > 0) {
      freezeMutation.mutate()
    }
  }

  const handleClaim = (rewardId: string) => {
    claimMutation.mutate({ rewardId })
  }

  const isLoading = statusLoading || activityLoading || rewardsLoading || 
    checkInMutation.isPending || freezeMutation.isPending || claimMutation.isPending

  const streak = status?.currentStreak || 0
  const longestStreak = status?.longestStreak || 0
  const freezes = status?.availableFreezes || 0
  const totalCheckIns = activity?.totalCheckIns || 0
  const nextRewardDays = Math.max(0, 7 - (streak % 7))

  const getActivityDays = (): number[] => {
    if (!activity?.activities) return []
    return activity.activities.map(a => parseInt(a.date.split('-')[2]))
  }
  const activityDays = getActivityDays()

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days: (number | null)[] = []
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    const today = new Date()
    const isCurrentMonth = today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    const todayDate = today.getDate()

    return (
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {WEEKDAYS.map((day, i) => (
          <div key={i} className="text-[10px] sm:text-xs font-medium text-gray-400 py-1 text-center">
            {day}
          </div>
        ))}
        {days.map((day, i) => {
          const isToday = isCurrentMonth && day === todayDate
          const hasActivity = day && activityDays.includes(day)
          
          return (
            <div
              key={i}
              className={`aspect-square sm:aspect-square flex items-center justify-center text-[10px] sm:text-xs rounded relative
                ${!day ? 'invisible' : ''}
                ${isToday ? 'bg-purple-600 text-white font-bold' : ''}
                ${hasActivity && !isToday ? 'bg-orange-100 text-orange-600' : ''}
              `}
            >
              {day}
              {hasActivity && !isToday && (
                <div className="absolute bottom-0.5 w-1 h-1 bg-orange-500 rounded-full" />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderWeekIndicators = () => {
    const indicators: number[] = []
    for (let i = 0; i < 7; i++) {
      indicators.push(i + 1)
    }
    
    return (
      <div className="flex items-center justify-center gap-1.5 sm:gap-3">
        {indicators.map((day) => {
          const isCompleted = streak >= day
          const isToday = streak === day - 1
          
          return (
            <div
              key={day}
              className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all
                ${isCompleted 
                  ? 'bg-orange-500 border-orange-500 text-white' 
                  : isToday
                    ? 'border-orange-500 text-orange-500'
                    : 'border-gray-200 text-gray-300'
                }
              `}
            >
              {isCompleted ? (
                <Check className="w-3 h-3 sm:w-5 sm:h-5" />
              ) : (
                <span className="text-[10px] sm:text-xs font-medium">S</span>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if(isLoading){
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }
  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Streaks</h1>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-30" />
        
        <div className="relative p-4 sm:p-8">
          <div className="text-center mb-3 sm:mb-6">
            <Flame className="w-10 h-10 sm:w-16 mx-auto mb-2 sm:mb-4 text-orange-200 animate-pulse" />
            <p className="text-orange-100 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
              {STREAK_MESSAGES[Math.min(streak, 6)]}
            </p>
            <p className="text-5xl sm:text-7xl font-black">{streak}</p>
            <p className="text-orange-100 text-sm sm:text-xl font-medium">Days</p>
          </div>

          <div className="mb-3 sm:mb-6">{renderWeekIndicators()}</div>

          <div className="flex items-center justify-between bg-black/20 -mx-4 sm:-mx-8 -mb-4 sm:-mb-8 px-4 sm:px-8 py-2 sm:py-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <Snowflake className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-200" />
              <span className="text-xs sm:text-sm font-medium">Streak Freeze:</span>
              <span className="font-bold">{freezes}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200" />
              <span className="text-xs sm:text-sm font-medium">Next reward:</span>
              <span className="font-bold">{nextRewardDays} days</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`pb-3 px-1 text-sm font-medium transition-colors relative
            ${activeTab === 'calendar' 
              ? 'text-purple-600 border-b-2 border-purple-600' 
              : 'text-gray-500 hover:text-gray-700'
            }
          `}
        >
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Calendar & History
          </span>
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`pb-3 px-1 text-sm font-medium transition-colors relative
            ${activeTab === 'rewards' 
              ? 'text-purple-600 border-b-2 border-purple-600' 
              : 'text-gray-500 hover:text-gray-700'
            }
          `}
        >
          <span className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Milestones & Rewards
          </span>
        </button>
      </div>

      {activeTab === 'calendar' && (
        <div className="grid md:grid-cols-2 gap-3 sm:gap-6">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="font-semibold text-sm sm:text-base">Activity Calendar</h3>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 rotate-180" />
                </button>
                <span className="text-xs sm:text-sm font-medium min-w-[80px] sm:min-w-[100px] text-center">
                  {currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
            {renderCalendar()}
            <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-4 text-[10px] sm:text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-orange-100 rounded-full" />
                <span>Checked in</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-600 rounded-full" />
                <span>Today</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-4">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-orange-50 flex items-center justify-center">
                  <Flame className="w-4 h-4 sm:w-6 sm:h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs sm:text-sm">Longest Streak</p>
                  <p className="text-2xl sm:text-3xl font-bold">{longestStreak}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-green-50 flex items-center justify-center">
                  <Check className="w-4 h-4 sm:w-6 sm:h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs sm:text-sm">Total Check-ins</p>
                  <p className="text-2xl sm:text-3xl font-bold">{totalCheckIns}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-blue-100">
              <div className="flex items-start gap-2 sm:gap-3">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 text-sm">Did you know?</p>
                  <p className="text-xs sm:text-sm text-blue-700">
                    Earn a streak freeze every 7 days! Use it to protect your streak if you miss a check-in.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="space-y-2 sm:space-y-4">
          {rewardsData?.rewards?.map((reward: Reward) => {
            const Icon = BADGE_ICONS[reward.badgeIcon] || Trophy
            const isLocked = !reward.isUnlocked
            const isClaimed = reward.isClaimed
            
            return (
              <div
                key={reward.rewardId}
                className={`bg-white rounded-xl sm:rounded-2xl shadow-sm border p-3 sm:p-5 flex items-center gap-2 sm:gap-4
                  ${isLocked ? 'border-gray-100 opacity-60' : 'border-gray-100'}
                `}
              >
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center
                  ${isLocked ? 'bg-gray-100' : isClaimed ? 'bg-green-100' : 'bg-purple-100'}
                `}>
                  {isLocked ? (
                    <Lock className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400" />
                  ) : (
                    <Icon className={`w-5 h-5 sm:w-7 sm:h-7 ${isClaimed ? 'text-green-600' : 'text-purple-600'}`} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{reward.name}</h3>
                    {isClaimed && (
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] sm:text-xs font-medium rounded-full">
                        Claimed
                      </span>
                    )}
                    {!isLocked && !isClaimed && (
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] sm:text-xs font-medium rounded-full">
                        Unlocked
                      </span>
                    )}
                    {isLocked && (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] sm:text-xs font-medium rounded-full">
                        Locked
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{reward.description}</p>
                  
                  {isLocked && (
                    <div className="mt-1 sm:mt-2">
                      <div className="h-1.5 sm:h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full transition-all"
                          style={{ width: `${reward.progress}%` }}
                        />
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                        {reward.progress.toFixed(0)}% complete
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0">
                  {!isLocked && !isClaimed && (
                    <button
                      onClick={() => handleClaim(reward.rewardId)}
                      disabled={claimMutation.isPending}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 text-white text-xs sm:text-sm rounded-lg sm:rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50"
                    >
                      {claimMutation.isPending ? 'Claiming...' : 'Claim'}
                    </button>
                  )}
                  {isClaimed && (
                    <span className="px-2 sm:px-4 py-1.5 sm:py-2 text-green-600 font-medium text-xs sm:text-sm">+{reward.pointsReward} pts</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!activeTab && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Daily Check-In</h2>
            <p className="text-gray-500 mb-4">
              Check in daily to maintain your streak and earn freeze tokens!
            </p>
            <button
              onClick={handleCheckIn}
              disabled={checkInMutation.isPending}
              className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium"
            >
              {checkInMutation.isPending ? 'Checking in...' : 'Check In Today'}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Freeze Token</h2>
            <p className="text-gray-500 mb-4">
              Use a freeze token to protect your streak if you miss a day.
            </p>
            <button
              onClick={handleFreeze}
              disabled={freezeMutation.isPending || !freezes}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {freezeMutation.isPending
                ? 'Using...'
                : freezes
                ? 'Use Freeze Token'
                : 'No Freeze Tokens'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default StreaksPage