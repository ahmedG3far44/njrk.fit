import React, { useState, useEffect, useCallback } from 'react';
import { Play, Clock, Award, Dumbbell, Zap, X, Sparkles, ArrowRight, Target, ChevronRight, Flame, CheckCircle2, BarChart3, Calendar, Loader2, FileDown, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { fitnessService, WorkoutSession, WorkoutPlan, Exercise } from '../services/fitnessService';
import { FitnessPlanLoader } from './GeneratingLoaders';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';

interface Workout {
  _id: string;
  title: string;
  type: string;
  duration: string;
  durationMin: number;
  intensity?: string;
  exercises: Exercise[];
  calories?: number;
  image?: string;
  isCompleted: boolean;
  dayOfWeek: string;
}

interface WeeklySession {
  day: string;
  title: string;
  type: string;
  duration: string;
  done?: boolean;
  session?: Workout;
}

const EQUIPMENT_OPTIONS = [
  'Dumbbells', 'Barbell', 'Kettlebell', 'Resistance Bands',
  'Bodyweight', 'Cable Machine', 'Pull-up Bar',
  'Rowing Machine', 'Treadmill', 'Cycling'
];

const STORAGE_KEY = 'njerka_fitness_preferences';

interface SavedPreferences {
  training_days: number;
  duration: number;
  equipment: string[];
}

export const Fitness: React.FC = () => {
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [planView, setPlanView] = useState<'daily' | 'weekly'>('daily');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [hasPlan, setHasPlan] = useState(false);
  const [planEndDate, setPlanEndDate] = useState<string | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());

  // Generate form state
  const [trainingDays, setTrainingDays] = useState(3);
  const [duration, setDuration] = useState(60);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Workout data
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<Workout | null>(null);
  const [weeklySessions, setWeeklySessions] = useState<WeeklySession[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false); // Used after generation

  const activeFilter = 'All';

  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const prefs: SavedPreferences = JSON.parse(saved);
        setTrainingDays(prefs.training_days || 3);
        setDuration(prefs.duration || 60);
        setSelectedEquipment(prefs.equipment || []);
      } catch (e) {
        console.error('Failed to load preferences:', e);
      }
    }
  }, []);

  // Save preferences
  const savePreferences = (days: number, dur: number, equip: string[]) => {
    const prefs: SavedPreferences = {
      training_days: days,
      duration: dur,
      equipment: equip
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  };

  // Fetch workout plan
  const fetchWorkoutPlan = useCallback(async (view: 'daily' | 'weekly', silent = false) => {
    if (!silent) setLoading(true);
    try {
      const dateParam = view === 'daily' ? 'today' : 'week';
      const response = await fitnessService.getCurrent({ date: dateParam });

      const responseSessions = Array.isArray(response.data) ? response.data : [];

      if (responseSessions.length > 0) {
        setHasPlan(true);
        setPlanEndDate(response.planEndDate || null);
        const sessions = responseSessions.map((session: WorkoutSession): Workout => ({
          _id: session._id,
          title: session.name,
          type: session.type,
          duration: `${session.durationMin} min`,
          durationMin: session.durationMin,
          exercises: session.exercises || [],
          isCompleted: session.isCompleted || false,
          dayOfWeek: session.dayOfWeek,
          calories: session.exercises?.length ? Math.round(session.durationMin * 8) : 0,
        }));

        // Find today's workout
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const todaySession = sessions.find(s => s.dayOfWeek === today) || sessions[0];
        setTodayWorkout(todaySession || null);

        // Build weekly sessions
        const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const weekly: WeeklySession[] = weekDays.map(day => {
          const session = sessions.find(s => s.dayOfWeek === day);
          return {
            day: day.substring(0, 3),
            title: session?.title || 'Rest Day',
            type: session?.type || 'Rest',
            duration: session?.duration || '0 min',
            done: session?.isCompleted || false,
            session: session
          };
        });
        setWeeklySessions(weekly);
        setHasGenerated(true);
      } else {
        setHasPlan(false);
        setPlanEndDate(null);
        setTodayWorkout(null);
        setWeeklySessions([]);
        setHasGenerated(false);
      }
    } catch (error) {
      console.error('Failed to fetch workout plan:', error);
      setHasPlan(false);
      setPlanEndDate(null);
      // toast.error('Failed to load workout plan');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load - fetch on mount
  useEffect(() => {
    fetchWorkoutPlan('daily', true).catch(() => {
      setHasPlan(false);
      setLoading(false);
    });
  }, []);

  // Fetch when view changes
  useEffect(() => {
    if (hasPlan) {
      fetchWorkoutPlan(planView);
    }
  }, [planView, hasPlan, fetchWorkoutPlan]);

  // Handle generate plan
  const handleGeneratePlan = async () => {
    if (selectedEquipment.length === 0) {
      toast.error('Please select at least one equipment');
      return;
    }

    setIsGenerating(true);
    try {
      // Save preferences
      savePreferences(trainingDays, duration, selectedEquipment);

      const response = await fitnessService.generate({
        duration,
        training_days: trainingDays,
        equipment: selectedEquipment,
        startDate
      });

      setWorkoutPlan(response.workoutPlan);
      setHasPlan(true);
      setHasGenerated(true);
      setShowStyleModal(false);

      // Fetch the plan
      await fetchWorkoutPlan(planView);

      toast.success('Workout plan generated successfully!');
    } catch (error) {
      console.error('Failed to generate plan:', error);
      toast.error('Failed to generate workout plan');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle complete session (full session or specific exercises)
  const handleCompleteSession = async (sessionId: string, currentCompleted: boolean, exerciseIndices?: number[]) => {
    const isPartialCompletion = exerciseIndices && exerciseIndices.length > 0;
    const prevWeekly = [...weeklySessions];
    const prevTodayWorkout = todayWorkout;

    // Find the session to check if it has exercises
    const session = weeklySessions.find(s => s.session?._id === sessionId)?.session || todayWorkout?._id === sessionId ? todayWorkout : null;
    const hasExercises = session && session.exercises && session.exercises.length > 0;

    // Optimistic update
    if (isPartialCompletion) {
      toast.success(`${exerciseIndices.length} exercise(s) marked as complete! +${exerciseIndices.length * 10} points`);
    } else {
      setWeeklySessions(weeklySessions.map(s =>
        s.session?._id === sessionId ? { ...s, done: !currentCompleted } : s
      ));
      if (todayWorkout?._id === sessionId) {
        setTodayWorkout({ ...todayWorkout, isCompleted: !currentCompleted });
      }
    }

    setCompletingId(sessionId);
    try {
      const data = isPartialCompletion ? { exerciseIndices } : undefined;
      const response = await fitnessService.completeSession(sessionId, data);

      // Update local state with response - handle cases where response might be different
      if (response && typeof response === 'object') {
        const workoutPlan = 'workoutPlan' in response ? (response as any).workoutPlan : null;

        if (workoutPlan && workoutPlan.sessions && Array.isArray(workoutPlan.sessions)) {
          const updatedSessions = workoutPlan.sessions.map((session: WorkoutSession): Workout => ({
            _id: session._id,
            title: session.name,
            type: session.type,
            duration: `${session.durationMin} min`,
            durationMin: session.durationMin,
            exercises: session.exercises || [],
            isCompleted: session.isCompleted || false,
            dayOfWeek: session.dayOfWeek,
            calories: session.exercises?.length ? Math.round(session.durationMin * 8) : 0,
          }));

          const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
          const todaySession = updatedSessions.find((s: any) => s.dayOfWeek === today) || updatedSessions[0];
          setTodayWorkout(todaySession || null);

          const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          setWeeklySessions(weekDays.map(day => {
            const session = updatedSessions.find((s: any) => s.dayOfWeek === day);
            return {
              day: day.substring(0, 3),
              title: session?.title || 'Rest Day',
              type: session?.type || 'Rest',
              duration: session?.duration || '0 min',
              done: session?.isCompleted || false,
              session: session
            };
          }));
        }
      }

      if (!isPartialCompletion) {
        toast.success(currentCompleted ? 'Marked as incomplete' : 'Great job! Session completed! +50 points');
      }
    } catch (error: any) {
      console.error('Failed to complete session:', error);

      // For sessions without exercises (like Recovery), keep the optimistic update
      // as there's nothing for the API to actually mark complete
      if (!hasExercises && !isPartialCompletion) {
        toast.success(currentCompleted ? 'Marked as incomplete' : 'Great job! Session completed! +50 points');
        return;
      }

      // Revert on error for sessions with exercises
      setWeeklySessions(prevWeekly);
      setTodayWorkout(prevTodayWorkout);

      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update session';
      toast.error(errorMessage);
    } finally {
      setCompletingId(null);
    }
  };

  // Toggle equipment selection
  const toggleEquipment = (equipment: string) => {
    setSelectedEquipment(prev =>
      prev.includes(equipment)
        ? prev.filter(e => e !== equipment)
        : [...prev, equipment]
    );
  };

  const typeConfig: Record<string, { bg: string; text: string; dot: string }> = {
    Strength: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-600' },
    Cardio: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
    Yoga: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    Mixed: { bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500' },
    Recovery: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
    Rest: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  };

  // Calculate stats
  const completedSessions = weeklySessions.filter(s => s.done).length;
  const totalSessions = weeklySessions.filter(s => s.session).length;
  const totalCalories = weeklySessions.reduce((acc, s) => acc + (s.session?.calories || 0), 0);
  const totalMinutes = weeklySessions.reduce((acc, s) => acc + (s.session?.durationMin || 0), 0);

  const generationLock = (() => {
    if (!planEndDate) return { canGenerate: true, message: null as string | null };
    const unlockDate = new Date(planEndDate);
    unlockDate.setDate(unlockDate.getDate() + 1);
    if (new Date() >= unlockDate) return { canGenerate: true, message: null };
    return {
      canGenerate: false,
      message: `New plan available on ${unlockDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    };
  })();

  const filteredUpcoming = activeFilter === 'All'
    ? weeklySessions.filter(s => s.session)
    : weeklySessions.filter(s => s.session && s.type === activeFilter);


  if (isGenerating) return <div className="w-full bg-black/80 backdrop-blur-md z-50 fixed left-0 top-0 min-h-screen flex items-center justify-center">
    <FitnessPlanLoader />
  </div>
  return (
    <div className="space-y-7 relative">
      {/* Generate Plan Modal */}
      <AnimatePresence>
        {showStyleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed w-full min-h-screen top-0 left-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-gradient-to-br from-green-900 to-green-700 p-6 text-white text-center relative overflow-hidden sticky top-0 z-10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12),transparent_70%)]" />
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 relative z-10 shadow-lg"
                >
                  <Target className="w-7 h-7 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2 relative z-10">
                  Generate Your Workout Plan
                </h2>
                <p className="text-green-200 text-sm relative z-10">
                  Customize your fitness plan with your preferences
                </p>
                <button
                  onClick={() => setShowStyleModal(false)}
                  className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors z-10"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {isGenerating ? (
                  <div className="text-center py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                      className="w-14 h-14 border-4 border-green-100 border-t-green-700 rounded-full mx-auto mb-5"
                    />
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <Sparkles className="w-6 h-6 text-green-400 mx-auto mb-3" />
                    </motion.div>
                    <p className="font-bold text-slate-900 text-lg">Building your plan...</p>
                    <p className="text-slate-400 text-sm mt-1">AI is crafting your personalized program</p>
                  </div>
                ) : (
                  <>
                    {/* Training Days */}
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">
                        Training Days per Week
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="1"
                          max="7"
                          value={trainingDays}
                          onChange={(e) => setTrainingDays(Number(e.target.value))}
                          className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                        />
                        <span className="text-lg font-bold text-green-700 w-8 text-center">{trainingDays}</span>
                      </div>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">
                        Session Duration (minutes)
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="15"
                          max="120"
                          step="5"
                          value={duration}
                          onChange={(e) => setDuration(Number(e.target.value))}
                          className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                        />
                        <span className="text-lg font-bold text-green-700 w-12 text-center">{duration}</span>
                      </div>
                    </div>

                    {/* Equipment */}
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">
                        Available Equipment
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {EQUIPMENT_OPTIONS.map(equip => (
                          <button
                            key={equip}
                            onClick={() => toggleEquipment(equip)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${selectedEquipment.includes(equip)
                              ? 'bg-green-50 border-green-500 text-green-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-green-300'
                              }`}
                          >
                            {selectedEquipment.includes(equip) && (
                              <CheckCircle2 className="w-4 h-4 inline mr-1" />
                            )}
                            {equip}
                          </button>
                        ))}
                      </div>
                      {selectedEquipment.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">Please select at least one equipment</p>
                      )}
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">
                        Start Date (optional)
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-600 outline-none text-sm"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setShowStyleModal(false)}
                        className="flex-1 py-3 border border-slate-200 rounded-xl font-semibold text-slate-500 hover:bg-slate-50 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGeneratePlan}
                        disabled={selectedEquipment.length === 0 || isGenerating}
                        className="flex-1 py-3 bg-gradient-to-r from-green-800 to-green-700 text-white rounded-xl font-bold disabled:opacity-40 hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate Plan
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workout Detail Modal */}
      <AnimatePresence>
        {selectedWorkout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed w-full min-h-screen top-0 left-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl max-h-[88vh] flex flex-col"
            >
              <div className="relative h-48 bg-slate-900 flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-green-800 to-green-700 flex items-center justify-center">
                  <Dumbbell className="w-20 h-20 text-white/30" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                <button
                  onClick={() => { setSelectedWorkout(null); setCompletedExercises(new Set()); }}
                  className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm p-2 rounded-full text-white hover:bg-black/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-6 left-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${typeConfig[selectedWorkout.type]?.bg || 'bg-white/20'} ${typeConfig[selectedWorkout.type]?.text || 'text-white'}`}>
                      {selectedWorkout.type}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold">{selectedWorkout.title}</h2>
                  <p className="opacity-80 text-sm mt-1">{selectedWorkout.duration}</p>
                </div>
              </div>

              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: 'Duration', value: selectedWorkout.duration, icon: Clock },
                    { label: 'Exercises', value: `${selectedWorkout.exercises?.length || 0} moves`, icon: Dumbbell },
                    { label: 'Est. Burn', value: `${selectedWorkout.calories || 0} kcal`, icon: Flame },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                      <s.icon className="w-4 h-4 text-green-700 mx-auto mb-1" />
                      <div className="font-bold text-slate-900 text-sm">{s.value}</div>
                      <div className="text-xs text-slate-400">{s.label}</div>
                    </div>
                  ))}
                </div>

                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-green-700" /> Routine Breakdown
                  {completedExercises.size > 0 && (
                    <span className="ml-2 text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      {completedExercises.size} selected
                    </span>
                  )}
                </h3>
                <div className="space-y-3">
                  {(selectedWorkout.exercises || []).length > 0 ? selectedWorkout.exercises.map((ex, i) => {
                    const isCompleted = completedExercises.has(i);
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-colors cursor-pointer ${isCompleted
                          ? 'bg-green-50 border-green-200'
                          : 'bg-slate-50 border-slate-100 hover:border-green-100 hover:bg-green-50/30'
                          }`}
                        onClick={() => {
                          const newSet = new Set(completedExercises);
                          if (isCompleted) {
                            newSet.delete(i);
                          } else {
                            newSet.add(i);
                          }
                          setCompletedExercises(newSet);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${isCompleted ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'
                            }`}>
                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                          </div>
                          <div className={`font-bold text-sm ${isCompleted ? 'text-green-700 line-through' : 'text-slate-800'}`}>
                            {ex.name}
                          </div>
                        </div>
                        <div className="flex gap-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <div className="flex flex-col items-center">
                            <span className={`text-base font-black ${isCompleted ? 'text-green-600' : 'text-green-700'}`}>{ex.sets}</span>
                            <span>Sets</span>
                          </div>
                          <div className="w-px bg-slate-200" />
                          <div className="flex flex-col items-center">
                            <span className={`text-base font-black ${isCompleted ? 'text-green-600' : 'text-green-700'}`}>{ex.reps}</span>
                            <span>Reps</span>
                          </div>
                          <div className="w-px bg-slate-200" />
                          <div className="flex flex-col items-center">
                            <span className="text-orange-500 text-base font-black">{ex.restSeconds || 60}s</span>
                            <span>Rest</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }) : (
                    <div className="text-center py-4 text-slate-400">No exercises</div>
                  )}
                </div>

                {(() => {
                  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                  const isToday = selectedWorkout.dayOfWeek === today;
                  const isNotTodayMessage = !isToday && (
                    <p className="text-xs text-slate-400 mt-3 text-center">
                      You can only complete workouts scheduled for today ({today})
                    </p>
                  );

                  return (
                    <>
                      {!selectedWorkout.isCompleted && (
                        <div className="flex gap-3 mt-6">
                          {completedExercises.size > 0 && (
                            <motion.button
                              whileHover={isToday ? { scale: 1.02 } : {}}
                              whileTap={isToday ? { scale: 0.98 } : {}}
                              onClick={() => {
                                const indices = Array.from(completedExercises);
                                handleCompleteSession(selectedWorkout._id, false, indices);
                                setSelectedWorkout(null);
                              }}
                              disabled={!isToday}
                              className={`flex-1 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${isToday
                                ? 'bg-orange-500 hover:opacity-90 shadow-orange-200'
                                : 'bg-slate-300 cursor-not-allowed shadow-none'
                                }`}
                            >
                              <CheckCircle2 className="w-5 h-5" /> Complete {completedExercises.size} Exercise{completedExercises.size > 1 ? 's' : ''}
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={isToday ? { scale: 1.02 } : {}}
                            whileTap={isToday ? { scale: 0.98 } : {}}
                            onClick={() => {
                              handleCompleteSession(selectedWorkout._id, false);
                              setSelectedWorkout(null);
                            }}
                            disabled={!isToday}
                            className={`${completedExercises.size > 0 ? 'flex-1' : 'w-full'} text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${isToday
                              ? 'bg-gradient-to-r from-green-800 to-green-700 hover:opacity-90 shadow-green-200'
                              : 'bg-slate-300 cursor-not-allowed shadow-none'
                              }`}
                          >
                            <Play className="w-5 h-5 fill-current" /> Mark Session Complete
                          </motion.button>
                        </div>
                      )}
                      {isNotTodayMessage}
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Fitness Hub</h1>
          <p className="text-slate-500">Your AI-personalized training schedule.</p>
        </div>

        {
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
              <button
                onClick={() => setPlanView('daily')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${planView === 'daily' ? 'bg-green-700 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Daily
              </button>
              <button
                onClick={() => setPlanView('weekly')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${planView === 'weekly' ? 'bg-green-700 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Weekly
              </button>
            </div>

            {generationLock.canGenerate ? (
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 15px 35px -5px rgba(99,102,241,0.45)' }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowStyleModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-green-800 to-green-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-green-200/60 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Sparkles className="w-4 h-4" />
                {hasPlan ? 'Regenerate Plan' : 'Generate AI Plan'}
              </motion.button>
            ) : (
              <div className="relative group">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled
                  className="flex items-center gap-2 bg-slate-300 text-slate-500 px-5 py-2.5 rounded-xl font-bold cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  {hasPlan ? 'Regenerate Plan' : 'Generate AI Plan'}
                </motion.button>
                {generationLock.message && (
                  <div className="absolute right-0 top-full mt-2 px-4 py-3 bg-slate-800 text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {generationLock.message}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => window.open(`${API_URL}/fitness/export/pdf`, '_blank')}
              disabled={!hasPlan}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-green-700 hover:border-green-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title="Export PDF"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        }
      </div>

      {/* Weekly Stats Strip */}
      {hasPlan && !loading && (
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 border border-green-100 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <div className="font-bold text-slate-900">{completedSessions} / {totalSessions}</div>
              <div className="text-xs text-slate-500">Sessions Done</div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <div className="font-bold text-slate-900">{totalCalories.toLocaleString()}</div>
              <div className="text-xs text-slate-500">Calories Burned</div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="bg-white rounded-2xl p-4 border border-green-100 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-green-800" />
            </div>
            <div>
              <div className="font-bold text-slate-900">{totalMinutes} min</div>
              <div className="text-xs text-slate-500">Active Minutes</div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Empty State or Content */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-green-600" />
          <p className="text-slate-500">Loading your workout plan...</p>
        </div>
      ) : !hasPlan ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-900 via-green-800 to-green-700 p-10 text-white text-center"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-700/30 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

          <div className="relative z-10">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
            >
              <Target className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-3">No Fitness Plan Yet</h2>
            <p className="text-green-200 mb-8 max-w-md mx-auto leading-relaxed">
              Generate a personalized workout plan tailored to your schedule, equipment, and fitness goals.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowStyleModal(true)}
              className="bg-white text-green-800 px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 mx-auto hover:bg-green-50 transition-colors shadow-xl"
            >
              <Sparkles className="w-5 h-5" />
              Build My AI Plan
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <div>
          <AnimatePresence mode="wait">
            {planView === 'daily' ? (
              <motion.div
                key="daily"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Hero Today Workout Card */}
                {todayWorkout ? (
                  <motion.div
                    onClick={() => { setSelectedWorkout(todayWorkout); setCompletedExercises(new Set()); }}
                    whileHover={{ scale: 1.01 }}
                    className="relative h-80 rounded-3xl overflow-hidden group cursor-pointer shadow-xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-800 to-green-700">
                      <img
                        src={"/gym.jpg"}
                        alt="Fitness"
                        className="object-cover opacity-60"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />

                    <div className="absolute top-5 right-5">
                      <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-white text-xs font-bold">Medium Intensity</span>
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 text-white text-xs font-bold rounded-lg mb-4">
                        {todayWorkout.isCompleted ? (
                          <><CheckCircle2 className="w-3 h-3" /> COMPLETED</>
                        ) : (
                          <><motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-1.5 h-1.5 bg-white rounded-full" /> TODAY'S SESSION</>
                        )}
                      </div>
                      <h2 className="text-4xl font-bold text-white mb-3">{todayWorkout.title}</h2>
                      <div className="flex flex-wrap gap-4 text-white/90 mb-5">
                        <div className="flex items-center gap-2"><Clock className="w-4 h-4 opacity-70" /> {todayWorkout.duration}</div>
                        <div className="flex items-center gap-2"><Award className="w-4 h-4 text-yellow-400" /> {todayWorkout.calories} kcal</div>
                        <div className="flex items-center gap-2"><Dumbbell className="w-4 h-4 opacity-70" /> {todayWorkout.exercises?.length || 0} exercises</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button className="bg-white text-slate-900 px-7 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-100 transition-colors shadow-lg">
                          <Play className="w-4 h-4 fill-current" /> View Routine
                        </button>
                        {!todayWorkout.isCompleted && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteSession(todayWorkout._id, false);
                            }}
                            disabled={completingId === todayWorkout._id}
                            className="text-white font-bold px-4 py-3 rounded-xl bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
                          >
                            {completingId === todayWorkout._id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              'Mark Complete'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="relative h-48 rounded-3xl overflow-hidden bg-slate-100 flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <Dumbbell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="font-medium">No workout scheduled for today</p>
                    </div>
                  </div>
                )}

                {/* Upcoming Sessions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-700" /> This Week
                      </h3>
                    </div>

                    <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                      {['All', 'Strength', 'Cardio', 'Yoga', 'Recovery'].map(f => (
                        <button
                          key={f}
                          onClick={() => { }}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeFilter === f
                            ? 'bg-green-700 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      {filteredUpcoming.slice(0, 5).map((session, i) => (
                        <motion.div
                          key={session.day}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => session.session && (setSelectedWorkout(session.session), setCompletedExercises(new Set()))}
                          className={`flex items-center gap-4 p-3.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer group ${session.done ? 'opacity-60' : ''}`}
                        >
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${session.done ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600 group-hover:bg-green-100 group-hover:text-green-700 transition-colors'}`}>
                            {session.done ? <CheckCircle2 className="w-5 h-5" /> : session.day}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-green-700 transition-colors">{session.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeConfig[session.type]?.bg || 'bg-slate-100'} ${typeConfig[session.type]?.text || 'text-slate-500'}`}>
                                {session.type}
                              </span>
                              <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {session.duration}</span>
                            </div>
                          </div>
                          <button className="p-2 text-slate-300 group-hover:text-green-600 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Weekly Goal Card */}
                  <div className="bg-gradient-to-br from-green-800 to-green-700 p-6 rounded-3xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-green-600/40 rounded-full blur-xl -ml-5 -mb-5" />

                    <h3 className="font-bold mb-1 relative z-10">Weekly Goal</h3>
                    <p className="text-green-200 text-xs mb-5 relative z-10">Keep the momentum going!</p>

                    <div className="flex items-end gap-2 mb-3 relative z-10">
                      <span className="text-5xl font-black">{completedSessions}</span>
                      <span className="text-xl opacity-70 mb-1">/ {totalSessions} sessions</span>
                    </div>

                    <div className="h-2.5 bg-black/20 rounded-full overflow-hidden mb-2 relative z-10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0}%` }}
                        transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-white rounded-full"
                      />
                    </div>
                    <p className="text-xs text-green-100 relative z-10 mb-6">
                      {totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0}% complete
                    </p>

                    <div className="space-y-2 relative z-10">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => {
                        const daySessions = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const isDone = weeklySessions[i]?.done;
                        const hasSession = weeklySessions[i]?.session;
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-white' : hasSession ? 'bg-white/30' : 'bg-transparent'}`}>
                              {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />}
                            </div>
                            <span className={`text-xs font-medium ${isDone ? 'text-white' : hasSession ? 'text-white/70' : 'text-white/30'}`}>{d}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="weekly"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Weekly Training Plan</h3>
                    <p className="text-slate-500 text-sm">Your full 7-day schedule at a glance</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-xl">
                    <BarChart3 className="w-4 h-4" /> {completedSessions} / {totalSessions} Done
                  </div>
                </div>
                <div className="divide-y divide-slate-50">
                  {weeklySessions.map((session, i) => (
                    <motion.div
                      key={session.day}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => session.session && (setSelectedWorkout(session.session), setCompletedExercises(new Set()))}
                      className={`flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors cursor-pointer group ${session.done ? 'opacity-70' : ''}`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${session.done ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600 group-hover:bg-green-100 group-hover:text-green-700'}`}>
                        {session.done ? <CheckCircle2 className="w-5 h-5" /> : session.day}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold text-sm ${session.done ? 'text-slate-400 line-through' : 'text-slate-900 group-hover:text-green-700'} transition-colors`}>
                          {session.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeConfig[session.type]?.bg || 'bg-slate-100'} ${typeConfig[session.type]?.text || 'text-slate-500'}`}>
                            {session.type}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {session.duration}</span>
                        </div>
                      </div>
                      {!session.done && session.session && (() => {
                        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                        const isToday = session.session.dayOfWeek === today;
                        return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteSession(session.session!._id, false);
                            }}
                            disabled={!isToday || completingId === session.session._id}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${isToday
                              ? 'text-green-700 bg-green-50 hover:bg-green-100'
                              : 'text-slate-400 bg-slate-100 cursor-not-allowed'
                              } disabled:opacity-50`}
                          >
                            {completingId === session.session._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              isToday ? 'Mark Done' : 'Not Today'
                            )}
                          </button>
                        );
                      })()}
                      <button className="p-2 text-slate-300 group-hover:text-green-500 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
