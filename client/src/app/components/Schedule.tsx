import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { CheckCircle2, Circle, Utensils, Dumbbell, Calendar, ChevronLeft, ChevronRight, Loader2, GripVertical, Cookie } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { scheduleService, ScheduleItem } from '../services/scheduleService';
import { Button } from './ui/button';

const ItemTypes = {
  TIMELINE_ITEM: 'timelineItem',
};

interface DragItem {
  index: number;
  id: string;
  type: string;
}

interface DraggableItemProps {
  slot: TimeSlot;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  onMarkComplete: (itemId: string, currentCompleted: boolean) => void;
  completingId: string | null;
  getTypeIcon: (type: 'meal' | 'snack' | 'workout') => React.ReactNode;
  getTypeColor: (type: 'meal' | 'snack' | 'workout') => string;
  canComplete: boolean;
}

const DraggableTimelineItem: React.FC<DraggableItemProps> = ({
  slot,
  index,
  moveItem,
  onMarkComplete,
  completingId,
  getTypeIcon,
  getTypeColor,
  canComplete,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.TIMELINE_ITEM,
    item: { index, id: slot.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.TIMELINE_ITEM,
    hover: (item: DragItem, monitor) => {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as any).y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  const handleClick = () => {
    if (slot.type === 'meal' || slot.type === 'snack') {
      navigate('/dashboard/nutrition');
    } else if (slot.type === 'workout') {
      navigate('/dashboard/fitness');
    }
  };

  return (
    <div
      ref={ref}
      className={`flex gap-4 group transition-all ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
      style={{ cursor: 'grab' }}
    >
      <div className="flex items-center justify-center w-8 text-slate-300 hover:text-slate-500">
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="relative flex-1">
        <div 
          onClick={handleClick}
          className="p-4 rounded-2xl border bg-white border-slate-100 hover:border-green-200 hover:shadow-md cursor-pointer transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getTypeColor(slot.type)}`}>
                {getTypeIcon(slot.type)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">
                  {slot.title}
                </h3>
                <span className={`text-xs font-medium ${
                  slot.type === 'meal' ? 'text-orange-500' :
                  slot.type === 'snack' ? 'text-amber-500' :
                  'text-blue-500'
                }`}>
                  {slot.type === 'workout' ? t('schedule.trainingSession') : slot.type.charAt(0).toUpperCase() + slot.type.slice(1)}
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-green-600 transition-colors" />
          </div>
          
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 pl-12">
            {slot.calories && (
              <span className={slot.type === 'workout' ? 'text-orange-500 font-medium' : ''}>
                {slot.type === 'workout' ? '🔥 Burn ' : '🔥 '}
                {slot.calories} kcal
              </span>
            )}
            {slot.duration && <span>⏱️ {slot.duration}</span>}
            {slot.type === 'workout' && slot.details.type && (
              <span className="text-blue-500 font-medium">{slot.details.type}</span>
            )}
            {(slot.type === 'meal' || slot.type === 'snack') && slot.details.macros && (
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
  );
};

interface TimeSlot {
  id: string;
  time: string;
  title: string;
  type: 'meal' | 'snack' | 'workout';
  calories?: number;
  duration?: string;
  durationMin?: number;
  completed: boolean;
  details: {
    macros?: { calories: number; protein: number; carbs: number; fat: number };
    estimatedCaloriesBurn?: number;
    type?: string;
    mealType?: string;
  };
}

export const Schedule: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const moveItem = useCallback((dragIndex: number, hoverIndex: number) => {
    setTimeSlots((prevSlots) => {
      const newSlots = [...prevSlots];
      const [removed] = newSlots.splice(dragIndex, 1);
      newSlots.splice(hoverIndex, 0, removed);
      return newSlots;
    });
  }, []);

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
        const details = item.details || {};
        
        return {
          id: item.id,
          time: item.time,
          title: item.name,
          type: item.type as 'meal' | 'snack' | 'workout',
          calories: item.type === 'meal' || item.type === 'snack'
            ? (details.macros?.calories || (details as any).calories)
            : details.estimatedCaloriesBurn,
          duration: details.durationMin ? `${details.durationMin} min` : undefined,
          durationMin: details.durationMin,
          completed: details.isCompleted || (item as any).isCompleted || false,
          details: details,
        };
      });
      
      const validSlots = slots.filter(slot => slot.time);
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
      toast.error(t('schedule.updateFailed'));
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

  const getTypeIcon = (type: 'meal' | 'snack' | 'workout') => {
    if (type === 'meal') return <Utensils className="w-4 h-4" />;
    if (type === 'snack') return <Cookie className="w-4 h-4" />;
    if (type === 'workout') return <Dumbbell className="w-4 h-4" />;
    return <CheckCircle2 className="w-4 h-4" />;
  };

  const getTypeColor = (type: 'meal' | 'snack' | 'workout') => {
    if (type === 'meal') return 'bg-orange-100 text-orange-600';
    if (type === 'snack') return 'bg-amber-100 text-amber-600';
    if (type === 'workout') return 'bg-blue-100 text-blue-600';
    return 'bg-purple-100 text-purple-600';
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <DndProvider backend={HTML5Backend}>
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t("schedule.title")}</h1>
          <p className="text-slate-500">{t("schedule.subtitle")}</p>
        </div>
        <div className="flex bg-white rounded-xl border border-slate-200 p-1">
          <Button variant="ghost" size="icon" onClick={() => navigateDate('prev')}>
            {i18n.dir() === 'rtl' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={goToToday} className="gap-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDisplayDate()}</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigateDate('next')}>
            {i18n.dir() === 'rtl' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </Button>
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
            <p className="text-slate-500">{t("schedule.loading")}</p>
          </div>
        ) : timeSlots.length > 0 ? (
          <>
            <div className="absolute top-0 bottom-0 left-4 w-px bg-slate-100" />
            
            <div className="space-y-6 relative z-10">
              <AnimatePresence>
                {timeSlots.map((slot, index) => (
                  <motion.div
                    key={slot.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <DraggableTimelineItem
                      slot={slot}
                      index={index}
                      moveItem={moveItem}
                      onMarkComplete={handleMarkComplete}
                      completingId={completingId}
                      getTypeIcon={getTypeIcon}
                      getTypeColor={getTypeColor}
                      canComplete={isToday}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Calendar className="w-16 h-16 mb-4 opacity-30" />
            <p className="font-medium text-lg">{t("schedule.noScheduleTitle")} {formatDisplayDate().toLowerCase()}</p>
            <p className="text-sm">{t("schedule.noScheduleDesc")}</p>
          </div>
        )}
      </div>
    </div>
    </DndProvider>
  );
};