import React, { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle2, Circle, Utensils, Dumbbell, Calendar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { scheduleService, ScheduleItem } from '../services/scheduleService';

interface TimeSlot {
  id: string;
  time: string;
  title: string;
  type: 'meal' | 'workout';
  calories?: number;
  duration?: string;
  durationMin?: number;
  completed: boolean;
  details: {
    macros?: { calories: number; protein: number; carbs: number; fat: number };
    estimatedCaloriesBurn?: number;
  };
}

export const Schedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    try {
      const response = await scheduleService.getTimeline(formatDate(selectedDate));
      console.log('Schedule API response:', response);
      
      if (!response.timeline || response.timeline.length === 0) {
        setTimeSlots([]);
        setLoading(false);
        return;
      }
      
      const slots: TimeSlot[] = response.timeline.map((item: ScheduleItem) => {
        // Handle different API response structures
        const details = item.details || {};
        
        return {
          id: item.id,
          time: item.time,
          title: item.name,
          type: item.type as 'meal' | 'workout',
          calories: item.type === 'meal' 
            ? (details.macros?.calories || details.calories)
            : details.estimatedCaloriesBurn,
          duration: details.durationMin ? `${details.durationMin} min` : undefined,
          durationMin: details.durationMin,
          completed: details.isCompleted || (item as any).isCompleted || false,
          details: details,
        };
      });
      
      // Sort by time
      const validSlots = slots.filter(slot => slot.time);
      validSlots.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      setTimeSlots(validSlots);
    } catch (error: any) {
      console.error('Failed to fetch timeline:', error);
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to load schedule';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const handleMarkComplete = async (itemId: string, currentCompleted: boolean) => {
    // Optimistic update
    const previousSlots = [...timeSlots];
    setTimeSlots(timeSlots.map(slot => 
      slot.id === itemId ? { ...slot, completed: !currentCompleted } : slot
    ));

    setCompletingId(itemId);
    try {
      await scheduleService.completeItem(itemId, { isCompleted: !currentCompleted });
      toast.success(currentCompleted ? 'Marked as incomplete' : 'Marked as complete!');
    } catch (error) {
      console.error('Failed to update item:', error);
      // Revert on error
      setTimeSlots(previousSlots);
      toast.error('Failed to update item');
    } finally {
      setCompletingId(null);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const getWeekDays = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    
    return weekDays.map((day, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return {
        day,
        date: date.getDate(),
        isToday: date.toDateString() === new Date().toDateString(),
        fullDate: date,
      };
    });
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const formatDisplayDate = () => {
    const today = new Date();
    if (selectedDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (selectedDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (selectedDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    return selectedDate.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getTypeIcon = (type: 'meal' | 'workout') => {
    if (type === 'meal') return <Utensils className="w-4 h-4" />;
    if (type === 'workout') return <Dumbbell className="w-4 h-4" />;
    return <CheckCircle2 className="w-4 h-4" />;
  };

  const getTypeColor = (type: 'meal' | 'workout') => {
    if (type === 'meal') return 'bg-orange-100 text-orange-600';
    if (type === 'workout') return 'bg-blue-100 text-blue-600';
    return 'bg-purple-100 text-purple-600';
  };

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Daily Schedule</h1>
          <p className="text-slate-500">Your personalized timeline for success.</p>
        </div>
        <div className="flex bg-white rounded-xl border border-slate-200 p-1">
          <button 
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-slate-50 rounded-lg text-slate-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={goToToday}
            className="flex items-center gap-2 px-4 font-bold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>{formatDisplayDate()}</span>
          </button>
          <button 
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-slate-50 rounded-lg text-slate-500"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Week Strip */}
      <div className="flex justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        {getWeekDays().map((item, i) => (
          <div 
            key={i} 
            onClick={() => handleDayClick(item.fullDate)}
            className={`flex flex-col items-center justify-center min-w-[60px] h-20 rounded-xl cursor-pointer transition-all ${
              item.fullDate.toDateString() === selectedDate.toDateString()
                ? 'bg-green-700 text-white shadow-lg shadow-green-200' 
                : 'hover:bg-slate-50 text-slate-500'
            }`}
          >
            <span className="text-xs font-medium mb-1">{item.day}</span>
            <span className={`text-xl font-bold ${
              item.fullDate.toDateString() === selectedDate.toDateString() 
                ? 'text-white' 
                : item.fullDate.toDateString() === new Date().toDateString()
                  ? 'text-green-600'
                  : 'text-slate-900'
            }`}>{item.date}</span>
            {item.fullDate.toDateString() === new Date().toDateString() && (
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2" />
            )}
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm p-8 relative overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-green-600 mb-3" />
            <p className="text-slate-500">Loading schedule...</p>
          </div>
        ) : timeSlots.length > 0 ? (
          <>
            <div className="absolute top-0 bottom-0 left-20 w-px bg-slate-100" />
            
            <div className="space-y-8 relative z-10">
              {timeSlots.map((slot, index) => (
                <div key={slot.id} className="flex gap-6 group">
                  <div className="w-14 text-right text-sm font-medium text-slate-400 pt-1">
                    {slot.time}
                  </div>
                  
                  <div className="relative flex-1">
                    <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 ${
                      slot.completed ? 'bg-green-700 border-green-700' : 'bg-white border-slate-300'
                    } z-10 transition-colors`} />
                    
                    <div className={`p-4 rounded-2xl border transition-all ${
                      slot.completed 
                        ? 'bg-green-50 border-green-100 opacity-75' 
                        : 'bg-white border-slate-100 hover:border-green-200 hover:shadow-md'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getTypeColor(slot.type)}`}>
                            {getTypeIcon(slot.type)}
                          </div>
                          <h3 className={`font-bold ${slot.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                            {slot.title}
                          </h3>
                        </div>
                        {slot.completed ? (
                          <div className="flex items-center gap-1 text-green-600 text-sm font-bold">
                            <CheckCircle2 className="w-4 h-4" /> Done
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleMarkComplete(slot.id, slot.completed)}
                            disabled={completingId === slot.id}
                            className="text-sm font-bold text-green-700 hover:bg-green-50 px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {completingId === slot.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Mark Done'
                            )}
                          </button>
                        )}
                      </div>
                      
                      <div className="flex gap-4 text-xs text-slate-500 pl-12">
                        {slot.calories && (
                          <span className={slot.type === 'workout' ? 'text-orange-500' : ''}>
                            {slot.type === 'workout' ? '🔥 Burn ' : '🔥 '}
                            {slot.calories} {slot.type === 'meal' ? 'kcal' : 'kcal'}
                          </span>
                        )}
                        {slot.duration && <span>⏱️ {slot.duration}</span>}
                        {slot.type === 'meal' && slot.details.macros && (
                          <>
                            <span>P: {slot.details.macros.protein}g</span>
                            <span>C: {slot.details.macros.carbs}g</span>
                            <span>F: {slot.details.macros.fat}g</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Calendar className="w-16 h-16 mb-4 opacity-30" />
            <p className="font-medium text-lg">No schedule for {formatDisplayDate().toLowerCase()}</p>
            <p className="text-sm">Generate a nutrition or fitness plan to see your schedule</p>
          </div>
        )}
      </div>
    </div>
  );
};