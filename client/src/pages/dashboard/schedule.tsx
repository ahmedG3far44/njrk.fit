import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { scheduleService } from '../../services/schedule'
import type { TimelineEvent } from '../../services/schedule'
import TimelineCard from '../../components/TimelineCard'
import PageActionButtons from '../../components/PageActionButtons'
import { downloadBlob, shareCurrentView } from '../../lib/pageActions'
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  UtensilsCrossed,
  Dumbbell,
} from 'lucide-react'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const SchedulePage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialSelectedDate = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate)
  const [timeRange, setTimeRange] = useState<'day' | 'week'>('day')

  const weekStart = useMemo(() => {
    const date = new Date(currentDate)
    const day = date.getDay()
    const start = new Date(date)
    start.setDate(start.getDate() - day)
    return start
  }, [currentDate])

  const weekDays = useMemo(() => {
    const days = []
    const start = new Date(weekStart)
    for (let i = 0; i < 7; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      days.push({
        date: day,
        dateStr: day.toISOString().split('T')[0],
        dayName: WEEKDAYS[day.getDay()],
        dayNum: day.getDate(),
        isToday: day.toDateString() === new Date().toDateString(),
      })
    }
    return days
  }, [weekStart])

  const { data, isLoading } = useQuery({
    queryKey: ['schedule', selectedDate],
    queryFn: () => scheduleService.getSchedule(selectedDate),
  })

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentDate(newDate)
    const newSelected = new Date(newDate)
    newSelected.setDate(newSelected.getDate() - newSelected.getDay())
    setSelectedDate(newSelected.toISOString().split('T')[0])
  }

  const handleNextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentDate(newDate)
    const newSelected = new Date(newDate)
    newSelected.setDate(newSelected.getDate() - newSelected.getDay())
    setSelectedDate(newSelected.toISOString().split('T')[0])
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentDate(today)
    const nextDate = today.toISOString().split('T')[0]
    setSelectedDate(nextDate)
    setSearchParams({ date: nextDate })
  }

  const handleSelectDay = (dateStr: string) => {
    setSelectedDate(dateStr)
    setSearchParams({ date: dateStr })
    const parts = dateStr.split('-')
    setCurrentDate(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])))
  }

  const handleShare = async () => {
    console.log('Sharing schedule...', { selectedDate, timeRange })
    const url = `${window.location.origin}/dashboard/schedule?date=${selectedDate}&timeRange=${timeRange}`
    await shareCurrentView(
      'Njerka Schedule',
      `Shared ${timeRange} schedule for ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
      url
    )
  }

  const handlePrint = async () => {
    console.log('Printing schedule...', { selectedDate, timeRange })
    try {
      const blob = await scheduleService.exportPdf(selectedDate, timeRange)
      console.log('PDF Blob received:', blob)
      downloadBlob(blob, `schedule-${timeRange}-${selectedDate}.pdf`)
    } catch (error) {
      console.error('Failed to export PDF:', error)
      alert('Failed to export PDF. Please check if you are logged in.')
    }
  }

  const timelineEvents: TimelineEvent[] = useMemo(() => {
    if (!data?.timeline?.length) {
      return [
        {
          id: '1',
          type: 'meal' as const,
          time: '08:00',
          title: 'Breakfast - Oatmeal & Berries',
          metadata: { calories: 450, protein: 18, carbs: 62, fat: 12 },
          isCompleted: false,
        },
        {
          id: '2',
          type: 'workout' as const,
          time: '10:00',
          title: 'Morning Workout - Cardio',
          metadata: { durationMin: 45, exerciseType: 'Cardio', exerciseCount: 6 },
          isCompleted: false,
        },
        {
          id: '3',
          type: 'meal' as const,
          time: '12:30',
          title: 'Lunch - Grilled Chicken Salad',
          metadata: { calories: 520, protein: 42, carbs: 35, fat: 18 },
          isCompleted: false,
        },
        {
          id: '4',
          type: 'meal' as const,
          time: '15:00',
          title: 'Snack - Protein Shake',
          metadata: { calories: 180, protein: 25, carbs: 8, fat: 3 },
          isCompleted: false,
        },
        {
          id: '5',
          type: 'meal' as const,
          time: '19:00',
          title: 'Dinner - Salmon with Vegetables',
          metadata: { calories: 620, protein: 45, carbs: 28, fat: 32 },
          isCompleted: false,
        },
        {
          id: '6',
          type: 'workout' as const,
          time: '20:30',
          title: 'Evening Stretch & Yoga',
          metadata: { durationMin: 20, exerciseType: 'Yoga', exerciseCount: 5 },
          isCompleted: false,
        },
      ]
    }
    
    return data.timeline.map((item) => ({
      id: item.id,
      type: item.type,
      time: item.time,
      title: item.name,
      metadata: {
        calories: item.details.macros?.calories,
        protein: item.details.macros?.protein,
        carbs: item.details.macros?.carbs,
        fat: item.details.macros?.fat,
        durationMin: item.details.durationMin,
        exerciseType: item.details.type,
        exerciseCount: item.details.exercises?.length,
      },
      isCompleted: item.details.isCompleted || false,
    })).sort((a, b) => a.time.localeCompare(b.time))
  }, [data])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{timeRange === 'day' ? 'Daily' : 'Weekly'} Schedule</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-xl mr-2">
            <button
              onClick={() => setTimeRange('day')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                timeRange === 'day'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                timeRange === 'week'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Week
            </button>
          </div>
          <button
            onClick={handlePrevWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-2 text-sm font-medium bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
          >
            Today
          </button>
          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <PageActionButtons onShare={handleShare} onPrint={handlePrint} />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <button
            key={day.dateStr}
            onClick={() => handleSelectDay(day.dateStr)}
            className={`p-3 rounded-xl transition-all text-center ${
              day.dateStr === selectedDate
                ? 'bg-purple-600 text-white'
                : day.isToday
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'bg-white border border-gray-100 hover:border-purple-200'
            }`}
          >
            <p className={`text-xs font-medium ${
              day.dateStr === selectedDate ? 'text-purple-200' : 'text-gray-500'
            }`}>
              {day.dayName}
            </p>
            <p className="text-lg font-bold mt-1">{day.dayNum}</p>
            {day.isToday && (
              <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 ${
                day.dateStr === selectedDate ? 'bg-white' : 'bg-purple-500'
              }`} />
            )}
          </button>
        ))}
      </div>

      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : timelineEvents.length > 0 ? (
          <div className="space-y-4 pl-4">
            {timelineEvents.map((event, index) => (
              <TimelineCard 
                key={`${event.id}-${index}`} 
                event={event}
                onToggle={(id, isCompleted) => {
                  console.log(`Toggle ${id}: ${isCompleted}`)
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No events scheduled</p>
            <p className="text-gray-400 text-sm mt-1">
              Generate a meal plan or workout plan to see your daily schedule
            </p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <a
                href="/dashboard/nutrition"
                className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors"
              >
                <UtensilsCrossed className="w-4 h-4" />
                Generate Meal Plan
              </a>
              <a
                href="/dashboard/fitness"
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
              >
                <Dumbbell className="w-4 h-4" />
                Generate Workout
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SchedulePage
