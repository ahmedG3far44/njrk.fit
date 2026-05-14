import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, Flame, Trophy, ScanLine, Camera, Zap,
  Utensils, Dumbbell, Brain, Clock, ChevronRight, TrendingUp,
  Droplets, Moon, Activity, Sparkles, X, Loader2
} from 'lucide-react';
import { nutritionService } from '../services/nutritionService';
import { fitnessService } from '../services/fitnessService';
import { gamificationService, InsightsData } from '../services/gamificationService';
import { toast } from 'sonner';

interface DashboardProps {
  user: any;
  onChangeView: (view: string) => void;
  onOpenCam: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onChangeView, onOpenCam }) => {
  const [aiTipVisible, setAiTipVisible] = useState(true);

  const [nutrition, setNutrition] = useState([
    { label: 'Calories', current: 0, target: 0, unit: 'kcal', color: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-600' },
    { label: 'Protein', current: 0, target: 0, unit: 'g', color: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-600' },
    { label: 'Carbs', current: 0, target: 0, unit: 'g', color: 'bg-green-500', light: 'bg-green-100', text: 'text-green-600' },
    { label: 'Fat', current: 0, target: 0, unit: 'g', color: 'bg-yellow-400', light: 'bg-yellow-100', text: 'text-yellow-600' },
  ]);

  const [vitals, setVitals] = useState([
    { label: 'Water', value: '0L', target: '2.5L', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50', progress: 0, progressColor: 'bg-blue-500' },
    { label: 'Sleep', value: '0h', target: '8h', icon: Moon, color: 'text-teal-500', bg: 'bg-teal-50', progress: 0, progressColor: 'bg-teal-500' },
    { label: 'Steps', value: '0', target: '10000', icon: Activity, color: 'text-green-500', bg: 'bg-green-50', progress: 0, progressColor: 'bg-green-500' },
  ]);

  const [upcomingMeal, setUpcomingMeal] = useState({
    name: '',
    time: '',
    calories: 0,
    image: '',
    macros: { p: '0g', c: '0g', f: '0g' },
  });

  const [nextWorkout, setNextWorkout] = useState({
    title: '',
    duration: '',
    intensity: '',
    time: '',
    type: '',
  });

  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    personalBest: 0,
  });

  const [groceryProgress] = useState({
    checked: 0,
    total: 0,
  });

  const [pointsData, setPointsData] = useState({
    current: 0,
    nextReward: 0,
  });

  const [aiTip, setAiTip] = useState({
    content: '',
  });

  const [loading, setLoading] = useState({
    nutrition: true,
    fitness: true,
    gamification: true,
  });

  const fetchNutritionData = useCallback(async () => {
    try {
      const response = await nutritionService.getCurrent({ date: 'today' });
      if (response) {
        const targetMacros = response.targetMacros || { calories: 0, protein: 0, carbs: 0, fats: 0 };
        const meals = response.meals || [];

        const consumed = meals.reduce((acc: { calories: number; protein: number; carbs: number; fats: number }, meal: any) => ({
          calories: acc.calories + (meal.macros?.calories || 0),
          protein: acc.protein + (meal.macros?.protein || 0),
          carbs: acc.carbs + (meal.macros?.carbs || 0),
          fats: acc.fats + (meal.macros?.fats || 0),
        }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

        setNutrition([
          { label: 'Calories', current: consumed.calories, target: targetMacros.calories, unit: 'kcal', color: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-600' },
          { label: 'Protein', current: consumed.protein, target: targetMacros.protein, unit: 'g', color: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-600' },
          { label: 'Carbs', current: consumed.carbs, target: targetMacros.carbs, unit: 'g', color: 'bg-green-500', light: 'bg-green-100', text: 'text-green-600' },
          { label: 'Fat', current: consumed.fats, target: targetMacros.fats, unit: 'g', color: 'bg-yellow-400', light: 'bg-yellow-100', text: 'text-yellow-600' },
        ]);

        if (meals.length > 0) {
          const nextMeal = meals.find((m: any) => !m.isCompleted) || meals[0];
          setUpcomingMeal({
            name: nextMeal.name || '',
            time: nextMeal.time || '',
            calories: nextMeal.macros?.calories || 0,
            image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            macros: {
              p: `${nextMeal.macros?.protein || 0}g`,
              c: `${nextMeal.macros?.carbs || 0}g`,
              f: `${nextMeal.macros?.fats || 0}g`
            },
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch nutrition data:', error);
    } finally {
      setLoading(prev => ({ ...prev, nutrition: false }));
    }
  }, []);

  const fetchFitnessData = useCallback(async () => {
    try {
      const response = await fitnessService.getCurrent({ date: 'today' });
      if (response && response.data && response.data.length > 0) {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const todaySession = response.data.find((s: any) => s.dayOfWeek === today) || response.data[0];

        if (todaySession) {
          setNextWorkout({
            title: todaySession.name || 'Workout',
            duration: `${todaySession.durationMin || 0} min`,
            intensity: todaySession.type || 'Medium',
            time: '',
            type: todaySession.type || 'Workout',
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch fitness data:', error);
    } finally {
      setLoading(prev => ({ ...prev, fitness: false }));
    }
  }, []);

  const fetchGamificationData = useCallback(async () => {
    try {
      const [statusRes, insightsRes] = await Promise.all([
        gamificationService.getStatus(),
        gamificationService.getInsights(),
      ]);

      if (statusRes) {
        setStreakData({
          currentStreak: statusRes.currentStreak || 0,
          personalBest: statusRes.longestStreak || 0,
        });
        setPointsData({
          current: statusRes.totalPoints || 0,
          nextReward: 500,
        });
      }

      if (insightsRes) {
        const stepGoal = insightsRes.userEstimatedSteps || 5000;

        setVitals([
          {
            label: 'Water',
            value: `${Math.round(insightsRes.estimatedWaterOz)}oz`,
            target: `${Math.round(insightsRes.estimatedWaterOz)}oz`,
            icon: Droplets,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
            progress: 100,
            progressColor: 'bg-blue-500',
          },
          {
            label: 'Sleep',
            value: `${insightsRes.estimatedSleepHours}h`,
            target: `8h`,
            icon: Moon,
            color: 'text-teal-500',
            bg: 'bg-teal-50',
            progress: Math.min(100, Math.round((insightsRes.estimatedSleepHours / 8) * 100)),
            progressColor: 'bg-teal-500',
          },
          {
            label: 'Steps',
            value: stepGoal.toLocaleString(),
            target: stepGoal.toLocaleString(),
            icon: Activity,
            color: 'text-green-500',
            bg: 'bg-green-50',
            progress: 100,
            progressColor: 'bg-green-500',
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch gamification data:', error);
    } finally {
      setLoading(prev => ({ ...prev, gamification: false }));
    }
  }, []);

  useEffect(() => {
    fetchNutritionData();
    fetchFitnessData();
    fetchGamificationData();
  }, [fetchNutritionData, fetchFitnessData, fetchGamificationData]);

  return (
    <div className="space-y-6 pb-8">
      {/* ── Hero Greeting ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>

          <h1 className="text-3xl font-bold text-slate-900">
            Good Morning, {user?.name || 'Friend'}! ☀️
          </h1>
          <p className="text-slate-500 mt-1">
            {streakData.currentStreak > 0 ? (
              <>
                You're on a{' '}
                <span className="inline-flex items-center gap-1 text-orange-500 font-bold">
                  <Flame className="w-4 h-4" /> {streakData.currentStreak}-day streak
                </span>
                . Keep it up!
              </>
            ) : (
              'Start your wellness journey today!'
            )}
          </p>
        </div>

        {/* Scan Meal CTA */}
        <motion.button
          onClick={onOpenCam}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-3 bg-gradient-to-r from-green-800 to-green-700 text-white px-5 py-3 rounded-2xl font-bold shadow-xl shadow-green-200/60 transition-all relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-xs opacity-80 font-medium">AI-Powered</div>
            <div className="text-sm font-bold">Scan Meal</div>
          </div>
          <ScanLine className="w-5 h-5 ml-1 opacity-70" />
        </motion.button>
      </motion.div>

      {/* ── Streak Banner ── */}
      <motion.div
        onClick={() => onChangeView('streaks')}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        whileHover={{ scale: 1.01 }}
        className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 rounded-3xl p-[2px] shadow-xl shadow-orange-200/50 cursor-pointer"
      >
        <div className="bg-white rounded-[22px] p-5 flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-2/5 bg-gradient-to-l from-orange-50/80 to-transparent pointer-events-none" />

          <div className="relative z-10 flex items-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              className="w-14 h-14 flex items-center justify-center"
            >
              <span className="text-4xl">🔥</span>
            </motion.div>
            <div>
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-4xl font-black text-slate-900">{streakData.currentStreak || '-'}</span>
                <span className="font-bold text-slate-600">Day Streak</span>
              </div>
              <p className="text-xs text-slate-400">Personal Best: <span className="text-orange-500 font-bold">{streakData.personalBest || '-'} days</span></p>
              <p className="text-xs text-slate-400 mt-0.5">Log one more meal to keep it alive!</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-orange-500 relative z-10 ml-3">
            <span className="text-xs font-bold">Rewards</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </motion.div>

      {/* ── Vitals Strip ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        {vitals.map((v, i) => (
          <motion.div
            key={v.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 ${v.bg} rounded-xl flex items-center justify-center`}>
                <v.icon className={`w-4 h-4 ${v.color}`} />
              </div>
              <span className="text-xs font-bold text-slate-400">{v.target}</span>
            </div>
            <div className="font-bold text-slate-900 mb-1">{v.value}</div>
            <div className="text-xs text-slate-400 mb-2">{v.label}</div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${v.progress}%` }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                className={`h-full ${v.progressColor} rounded-full`}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Nutrition Snapshot ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        onClick={() => onChangeView('nutrition')}
        className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-all group"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 leading-tight">Nutrition Snapshot</h3>
              <p className="text-xs text-slate-400">Daily macros progress</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-green-700 font-bold bg-green-50 px-2.5 py-1 rounded-lg">Today</span>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-green-600 transition-colors" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {nutrition.map((n, i) => (
            <div key={n.label}>
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${n.color}`} />
                  <span className="text-sm font-semibold text-slate-700">{n.label}</span>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {n.current}<span className="text-slate-400 font-normal text-xs">/{n.target}{n.unit}</span>
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((n.current / n.target) * 100, 100)}%` }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                  className={`h-full ${n.color} rounded-full`}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Upcoming Meal + Next Workout ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Meal */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          onClick={() => onChangeView('nutrition')}
          className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
        >
          <div className="relative h-36 bg-slate-100">
            {upcomingMeal.image ? (
              <img
                src={upcomingMeal.image}
                alt={upcomingMeal.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                <Utensils className="w-12 h-12 text-slate-300" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
            {upcomingMeal.time && (
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-green-800 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                <Clock className="w-3 h-3" /> {upcomingMeal.time}
              </div>
            )}
            {upcomingMeal.calories > 0 && (
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-orange-600 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                🔥 {upcomingMeal.calories} kcal
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Utensils className="w-3.5 h-3.5 text-green-700" />
              <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Upcoming Meal</span>
            </div>
            <h3 className="font-bold text-slate-900 mb-2.5 group-hover:text-green-700 transition-colors">
              {upcomingMeal.name || 'No meal scheduled'}
            </h3>
            <div className="flex gap-2">
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-semibold">P: {upcomingMeal.macros.p}</span>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg font-semibold">C: {upcomingMeal.macros.c}</span>
              <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg font-semibold">F: {upcomingMeal.macros.f}</span>
            </div>
          </div>
        </motion.div>

        {/* Next Workout */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => onChangeView('fitness')}
          className="bg-gradient-to-br from-green-800 to-green-700 rounded-3xl p-6 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-700/20 rounded-full blur-xl -ml-6 -mb-6" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(255,255,255,0.05),transparent_60%)]" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Dumbbell className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-green-200 uppercase tracking-wider">Next Workout</span>
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-1.5 h-1.5 bg-green-400 rounded-full"
                />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-1">
              {nextWorkout.title || 'No workout scheduled'}
            </h3>
            <p className="text-green-200 text-sm mb-5">{nextWorkout.time || ''}</p>

            <div className="flex gap-2 mb-6 flex-wrap">
              {nextWorkout.duration && (
                <span className="text-xs bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 border border-white/10">
                  <Clock className="w-3 h-3" /> {nextWorkout.duration}
                </span>
              )}
              {nextWorkout.intensity && (
                <span className="text-xs bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 border border-white/10">
                  <Zap className="w-3 h-3" /> {nextWorkout.intensity}
                </span>
              )}
              {nextWorkout.type && (
                <span className="text-xs bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg font-semibold border border-white/10">
                  {nextWorkout.type}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-white font-bold group-hover:gap-3 transition-all">
              <span>View Routine</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Quick Actions Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Community Challenge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={() => onChangeView('community')}
          className="group relative h-44 rounded-3xl overflow-hidden cursor-pointer"
        >
          <img
            src="https://images.unsplash.com/photo-1662549905044-e3f71c293989?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncm91cCUyMGZpdG5lc3MlMjBmcmllbmRzJTIwc21pbGluZ3xlbnwxfHx8fDE3Njg3MDA1ODV8MA&ixlib=rb-4.1.0&q=80&w=1080"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            alt="Community"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-0 left-0 p-5 text-white">
            <div className="flex items-center gap-1.5 mb-1">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Live Challenge</span>
            </div>
            <h3 className="font-bold">Step Challenge</h3>
            <p className="text-white/70 text-xs mt-0.5">Join the community challenge!</p>
          </div>
        </motion.div>

        {/* Grocery */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          onClick={() => onChangeView('grocery')}
          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Grocery</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-green-600 transition-colors" />
          </div>
          <h3 className="font-bold text-slate-900 mb-1">Shopping List</h3>
          <p className="text-slate-400 text-xs mb-3">
            {groceryProgress.total - groceryProgress.checked} items remaining this week
          </p>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${groceryProgress.total > 0 ? (groceryProgress.checked / groceryProgress.total) * 100 : 0}%` }}
              transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-slate-400">
              {groceryProgress.checked} of {groceryProgress.total} checked
            </p>
            <p className="text-xs font-bold text-emerald-600">
              {groceryProgress.total > 0 ? Math.round((groceryProgress.checked / groceryProgress.total) * 100) : 0}%
            </p>
          </div>
        </motion.div>

        {/* Rewards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={() => onChangeView('streaks')}
          className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-5 cursor-pointer hover:scale-[1.02] transition-transform relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-6 -mt-6" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-red-400/30 rounded-full blur-xl -ml-4 -mb-4" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-300" />
                <span className="text-xs font-bold text-orange-100 uppercase tracking-wider">Rewards</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-bold text-white text-xl mb-0.5">{pointsData.current} pts</h3>
            <p className="text-orange-100 text-xs mb-3">
              {pointsData.nextReward > 0 ? `${pointsData.nextReward} pts until next badge!` : 'Start earning points!'}
            </p>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pointsData.nextReward > 0 ? (pointsData.current / pointsData.nextReward) * 100 : 0}%` }}
                transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── AI Insight ── */}
      <AnimatePresence>
        {aiTipVisible && aiTip.content && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-gradient-to-r from-slate-900 to-green-900 rounded-3xl p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-green-600/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -mb-10 pointer-events-none" />

            <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-green-700 to-green-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-green-300 uppercase tracking-wider">AI Daily Insight</span>
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-1.5 h-1.5 bg-green-400 rounded-full"
                  />
                </div>
                <p className="text-white/90 text-sm leading-relaxed">
                  {aiTip.content}
                </p>
              </div>
              <button
                onClick={() => setAiTipVisible(false)}
                className="text-white/40 hover:text-white/70 transition-colors p-1 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/10 relative z-10">
              <Sparkles className="w-4 h-4 text-green-400" />
              <p className="text-xs text-green-300 font-medium">Powered by Njerka AI — updates daily based on your progress</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};