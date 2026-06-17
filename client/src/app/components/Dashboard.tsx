import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Flame,
  Trophy,
  ScanLine,
  Camera,
  Zap,
  Utensils,
  Dumbbell,
  Brain,
  Clock,
  ChevronRight,
  TrendingUp,
  Droplets,
  Moon,
  Activity,
  Sparkles,
  X,
} from "lucide-react";
import { nutritionService } from "../services/nutritionService";
import { fitnessService } from "../services/fitnessService";
import { gamificationService } from "../services/gamificationService";
import { useTranslation } from "react-i18next";
import GoalProgressBar from "./GoalProgressBar";
import { Button } from "./ui/button";

interface DashboardProps {
  user: any;
  onChangeView: (view: string) => void;
  onOpenCam: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onChangeView,
  onOpenCam,
}) => {
  const { t } = useTranslation();
  const [aiTipVisible, setAiTipVisible] = useState(true);

  const [nutrition, setNutrition] = useState([
    {
      label: t("dashboard.calories"),
      current: 0,
      target: 0,
      unit: "kcal",
      color: "bg-orange-500",
      light: "bg-orange-100",
      text: "text-orange-600",
    },
    {
      label: t("dashboard.protein"),
      current: 0,
      target: 0,
      unit: "g",
      color: "bg-blue-500",
      light: "bg-blue-100",
      text: "text-blue-600",
    },
    {
      label: t("dashboard.carbs"),
      current: 0,
      target: 0,
      unit: "g",
      color: "bg-green-500",
      light: "bg-green-100",
      text: "text-green-600",
    },
    {
      label: t("dashboard.fat"),
      current: 0,
      target: 0,
      unit: "g",
      color: "bg-yellow-400",
      light: "bg-yellow-100",
      text: "text-yellow-600",
    },
  ]);

  const [vitals, setVitals] = useState([
    {
      label: t("dashboard.waterLabel"),
      value: "0L",
      target: "2.5L",
      icon: Droplets,
      color: "text-blue-500",
      bg: "bg-blue-50",
      progress: 0,
      progressColor: "bg-blue-500",
    },
    {
      label: t("dashboard.sleepLabel"),
      value: "0h",
      target: "8h",
      icon: Moon,
      color: "text-teal-500",
      bg: "bg-teal-50",
      progress: 0,
      progressColor: "bg-teal-500",
    },
    {
      label: t("dashboard.stepsLabel"),
      value: "0",
      target: "10000",
      icon: Activity,
      color: "text-green-500",
      bg: "bg-green-50",
      progress: 0,
      progressColor: "bg-green-500",
    },
  ]);

  const [upcomingMeal, setUpcomingMeal] = useState({
    name: "",
    time: "",
    calories: 0,
    image: "",
    macros: { p: "0g", c: "0g", f: "0g" },
  });

  const [nextWorkout, setNextWorkout] = useState({
    title: "",
    duration: "",
    intensity: "",
    time: "",
    type: "",
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

  const aiTipContent = t("dashboard.aiInsightContent");

  const [loading, setLoading] = useState({
    nutrition: true,
    fitness: true,
    gamification: true,
  });

  const fetchNutritionData = useCallback(async () => {
    try {
      const response = await nutritionService.getCurrent({ date: "today" });
      if (response) {
        const targetMacros = response.targetMacros || {
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
        };
        const meals = response.meals || [];

        const consumed = meals.reduce(
          (
            acc: {
              calories: number;
              protein: number;
              carbs: number;
              fats: number;
            },
            meal: any,
          ) => ({
            calories: acc.calories + (meal.macros?.calories || 0),
            protein: acc.protein + (meal.macros?.protein || 0),
            carbs: acc.carbs + (meal.macros?.carbs || 0),
            fats: acc.fats + (meal.macros?.fats || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fats: 0 },
        );

        setNutrition([
          {
            label: t("dashboard.calories"),
            current: consumed.calories,
            target: targetMacros.calories,
            unit: "kcal",
            color: "bg-orange-500",
            light: "bg-orange-100",
            text: "text-orange-600",
          },
          {
            label: t("dashboard.protein"),
            current: consumed.protein,
            target: targetMacros.protein,
            unit: "g",
            color: "bg-blue-500",
            light: "bg-blue-100",
            text: "text-blue-600",
          },
          {
            label: t("dashboard.carbs"),
            current: consumed.carbs,
            target: targetMacros.carbs,
            unit: "g",
            color: "bg-green-500",
            light: "bg-green-100",
            text: "text-green-600",
          },
          {
            label: t("dashboard.fat"),
            current: consumed.fats,
            target: targetMacros.fats,
            unit: "g",
            color: "bg-yellow-400",
            light: "bg-yellow-100",
            text: "text-yellow-600",
          },
        ]);

        if (meals.length > 0) {
          const nextMeal = meals.find((m: any) => !m.isCompleted) || meals[0];
          setUpcomingMeal({
            name: nextMeal.name || "",
            time: nextMeal.time || "",
            calories: nextMeal.macros?.calories || 0,
            image:
              "https://images.unsplash.com/photo-1574484284002-952d92456975?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            macros: {
              p: `${nextMeal.macros?.protein || 0}g`,
              c: `${nextMeal.macros?.carbs || 0}g`,
              f: `${nextMeal.macros?.fats || 0}g`,
            },
          });
        }
      }
    } catch (_error) {
    } finally {
      setLoading((prev) => ({ ...prev, nutrition: false }));
    }
  }, []);

  const fetchFitnessData = useCallback(async () => {
    try {
      const response = await fitnessService.getCurrent({ date: "today" });
      if (response && response.data && response.data.length > 0) {
        const today = new Date().toLocaleDateString("en-US", {
          weekday: "long",
        });
        const todaySession =
          response.data.find((s: any) => s.dayOfWeek === today) ||
          response.data[0];

        if (todaySession) {
          setNextWorkout({
            title: todaySession.name || "Workout",
            duration: `${todaySession.durationMin || 0} min`,
            intensity: todaySession.type || "Medium",
            time: "",
            type: todaySession.type || "Workout",
          });
        }
      }
    } catch (_error) {
    } finally {
      setLoading((prev) => ({ ...prev, fitness: false }));
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
            label: t("dashboard.waterLabel"),
            value: insightsRes.estimatedWaterMl >= 1000 ? `${(insightsRes.estimatedWaterMl / 1000).toFixed(1)}L` : `${Math.round(insightsRes.estimatedWaterMl)}ml`,
            target: insightsRes.estimatedWaterMl >= 1000 ? `${(insightsRes.estimatedWaterMl / 1000).toFixed(1)}L` : `${Math.round(insightsRes.estimatedWaterMl)}ml`,
            icon: Droplets,
            color: "text-blue-500",
            bg: "bg-blue-50",
            progress: 100,
            progressColor: "bg-blue-500",
          },
          {
            label: t("dashboard.sleepLabel"),
            value: `${insightsRes.estimatedSleepHours}h`,
            target: `8h`,
            icon: Moon,
            color: "text-teal-500",
            bg: "bg-teal-50",
            progress: Math.min(
              100,
              Math.round((insightsRes.estimatedSleepHours / 8) * 100),
            ),
            progressColor: "bg-teal-500",
          },
          {
            label: t("dashboard.stepsLabel"),
            value: stepGoal.toLocaleString(),
            target: stepGoal.toLocaleString(),
            icon: Activity,
            color: "text-green-500",
            bg: "bg-green-50",
            progress: 100,
            progressColor: "bg-green-500",
          },
        ]);
      }
    } catch (_error) {
    } finally {
      setLoading((prev) => ({ ...prev, gamification: false }));
    }
  }, []);

  useEffect(() => {
    fetchNutritionData();
    fetchFitnessData();
    fetchGamificationData();
  }, [fetchNutritionData, fetchFitnessData, fetchGamificationData]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* ── Hero Greeting ── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl max-sm:text-xl font-bold sm:font-semibold text-slate-900 leading-tight">
            {t("dashboard.greetingMorning")} {user?.name || t("dashboard.greetingFriend")}.
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            {streakData.currentStreak > 0 ? (
              <>
                {t("dashboard.streakActive")}{" "}
                <span className="inline-flex items-center gap-1 text-orange-500 font-bold">
                  <Flame className="w-3.5 h-3.5" /> {streakData.currentStreak}{t("dashboard.dayStreakLabel")}
                </span>
                . {t("dashboard.keepItUp")}
              </>
            ) : (
              t("dashboard.startJourney")
            )}
          </p>
        </div>

        {/* Today's Focus Card */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-50 sm:border-transparent w-fit">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-green-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-700 animate-pulse" />
          </div>
          <div className="text-start">
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
              Today's Focus
            </div>
            <div className="text-xs sm:text-sm font-black text-slate-800">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Streak Banner ── */}
      <motion.div
        onClick={() => onChangeView("streaks")}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        whileHover={{ scale: 1.005 }}
        className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 rounded-2xl sm:rounded-3xl p-[2px] shadow-lg sm:shadow-xl shadow-orange-200/50 cursor-pointer"
      >
        <div className="bg-white rounded-[14px] sm:rounded-[22px] p-4 sm:p-5 flex items-center justify-between relative overflow-hidden">
          <div className="absolute end-0 top-0 bottom-0 w-2/5 bg-gradient-to-l from-orange-50/80 to-transparent pointer-events-none" />

          <div className="relative z-10 flex items-center gap-3.5 sm:gap-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center text-2xl sm:text-4xl">
              🔥
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 sm:gap-2 mb-0.5">
                <span className="text-2xl sm:text-4xl font-black text-slate-900 leading-none">
                  {streakData.currentStreak || "-"}
                </span>
                <span className="font-bold text-slate-600 text-xs sm:text-base">{t("dashboard.dayStreak")}</span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400">
                {t("dashboard.streakPersonalBest")}{" "}
                <span className="text-orange-500 font-bold">
                  {streakData.personalBest || "-"} {t("dashboard.days")}
                </span>
              </p>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                {t("dashboard.logMoreMeals")}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-orange-500 relative z-10 ms-3">
            <span className="text-xs font-bold">{t("dashboard.rewards")}</span>
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </div>
        </div>
      </motion.div>

      {/* ── Vitals Strip ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        className="grid grid-cols-3 gap-2 sm:gap-4"
      >
        {vitals.map((v, i) => {
          const isSteps = v.label === "Steps";
          const isGoogleLinked = Boolean(user?.googleId);

          if (isSteps && !isGoogleLinked) {
            const stepGoal = user?.estimatedSteps || 5000;
            const getGoalDurationDays = () => {
              if (!user?.goalDate) return 120;
              const startDate = user.createdAt
                ? new Date(user.createdAt)
                : new Date();
              const endDate = new Date(user.goalDate);
              const diffTime = endDate.getTime() - startDate.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays > 0 ? diffDays : 120;
            };
            const days = getGoalDurationDays();
            const totalSteps = stepGoal * days;

            return (
              <motion.div
                key={v.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 ${v.bg} rounded-lg sm:rounded-xl flex items-center justify-center`}
                    >
                      <v.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${v.color}`} />
                    </div>
                    <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 truncate">
                      {t("dashboard.target")} {stepGoal.toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs sm:text-lg font-black text-slate-900 leading-tight">
                      {stepGoal.toLocaleString()}{" "}
                      <span className="text-[8px] sm:text-[10px] text-slate-400 font-semibold">
                        /d
                      </span>
                    </div>
                    <div className="text-[10px] sm:text-xs font-bold text-green-700 leading-tight">
                      {totalSteps.toLocaleString()}{" "}
                      <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium block sm:inline">
                        {t("dashboard.total")} ({days}d)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-[8px] sm:text-[10px] font-semibold text-slate-400 mt-1.5">
                  {t("dashboard.dailyTotalSteps")}
                </div>
              </motion.div>
            );
          }

          return (
            <motion.div
              key={v.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 ${v.bg} rounded-lg sm:rounded-xl flex items-center justify-center`}
                  >
                    <v.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${v.color}`} />
                  </div>
                  <span className="text-[9px] sm:text-xs font-bold text-slate-400">
                    {v.target}
                  </span>
                </div>
                <div className="font-bold text-xs sm:text-lg text-slate-900 mb-0.5 sm:mb-1 leading-none">{v.value}</div>
                <div className="text-[10px] sm:text-xs text-slate-400 mb-1.5 sm:mb-2 leading-none">{v.label}</div>
              </div>
              <div className="h-1 sm:h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${v.progress}%` }}
                  transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                  className={`h-full ${v.progressColor} rounded-full`}
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Goal Progress ── */}
      <GoalProgressBar user={user} />

      {/* ── Nutrition Snapshot ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        onClick={() => onChangeView("nutrition")}
        className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow group"
      >
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-orange-100 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                {t("dashboard.nutritionSnapshot")}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-400">{t("dashboard.dailyMacros")}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-xs text-green-700 font-bold bg-green-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg">
              {t("dashboard.today")}
            </span>
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 group-hover:text-green-600 transition-colors rtl:rotate-180" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-3 sm:gap-y-4">
          {nutrition.map((n, i) => (
            <div key={n.label}>
              <div className="flex justify-between items-center mb-1 sm:mb-1.5">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${n.color}`} />
                  <span className="text-xs sm:text-sm font-semibold text-slate-700">
                    {n.label}
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  {n.current}
                  <span className="text-slate-400 font-normal text-[10px] sm:text-xs">
                    /{n.target}
                    {n.unit}
                  </span>
                </span>
              </div>
              <div className="h-1.5 sm:h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min((n.current / n.target) * 100, 100)}%`,
                  }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  className={`h-full ${n.color} rounded-full`}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          onClick={() => onChangeView("nutrition")}
          className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300 group relative"
        >
          <div className="relative h-28 sm:h-36 bg-slate-100">
            {upcomingMeal.image ? (
              <img
                src={upcomingMeal.image}
                alt={upcomingMeal.name}
                className="absolute hover:scale-105 w-full h-full object-cover transition-transform duration-500"
              />
            ) : (
              <div className="absolute flex items-center justify-center bg-slate-100">
                <Utensils className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300" />
              </div>
            )}
            <div className="absolute bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
            {upcomingMeal.time && (
              <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 bg-white/90 backdrop-blur-sm text-green-800 text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg flex items-center gap-1 shadow-sm">
                <Clock className="w-3 h-3" /> {upcomingMeal.time}
              </div>
            )}
            {upcomingMeal.calories > 0 && (
              <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 bg-white/90 backdrop-blur-sm text-orange-600 text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg shadow-sm">
                🔥 {upcomingMeal.calories} kcal
              </div>
            )}
          </div>
          <div className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
              <Utensils className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-700" />
              <span className="text-[10px] sm:text-xs font-bold text-green-700 uppercase tracking-wider">
                {t("dashboard.upcomingMeal")}
              </span>
            </div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-2 group-hover:text-green-700 transition-colors">
              {upcomingMeal.name || t("dashboard.noMealScheduled")}
            </h3>
            <div className="flex gap-1.5 sm:gap-2">
              <span className="text-[10px] sm:text-xs bg-blue-50 text-blue-700 px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg font-semibold">
                P: {upcomingMeal.macros.p}
              </span>
              <span className="text-[10px] sm:text-xs bg-green-50 text-green-700 px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg font-semibold">
                C: {upcomingMeal.macros.c}
              </span>
              <span className="text-[10px] sm:text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg font-semibold">
                F: {upcomingMeal.macros.f}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Next Workout */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          onClick={() => onChangeView("fitness")}
          className="bg-gradient-to-br from-green-800 to-green-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 end-0 w-36 h-36 bg-white/10 rounded-full blur-2xl -me-10 -mt-10" />
          <div className="absolute bottom-0 start-0 w-24 h-24 bg-green-700/20 rounded-full blur-xl -ms-6 -mb-6" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(255,255,255,0.05),transparent_60%)]" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Dumbbell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-xs font-bold text-green-200 uppercase tracking-wider">
                  {t("dashboard.nextWorkout")}
                </span>
                <span className="w-1.5 h-1.5 bg-green-400/60 rounded-full" />
              </div>
            </div>

            <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-white mb-0.5 sm:mb-1 leading-tight">
              {nextWorkout.title || t("dashboard.noWorkoutScheduled")}
            </h3>
            <p className="text-green-200 text-xs sm:text-sm mb-4 sm:mb-5">
              {nextWorkout.time || ""}
            </p>

            <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 flex-wrap">
              {nextWorkout.duration && (
                <span className="text-[10px] sm:text-xs bg-white/20 backdrop-blur-sm text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-semibold flex items-center gap-1 border border-white/10">
                  <Clock className="w-3 h-3" /> {nextWorkout.duration}
                </span>
              )}
              {nextWorkout.intensity && (
                <span className="text-[10px] sm:text-xs bg-white/20 backdrop-blur-sm text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-semibold flex items-center gap-1 border border-white/10">
                  <Zap className="w-3 h-3" /> {nextWorkout.intensity}
                </span>
              )}
              {nextWorkout.type && (
                <span className="text-[10px] sm:text-xs bg-white/20 backdrop-blur-sm text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-semibold border border-white/10">
                  {nextWorkout.type}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-white font-bold group-hover:translate-x-0.5 transition-transform duration-200 text-xs sm:text-sm">
              <span>{t("dashboard.viewRoutine")}</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Quick Actions Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Community Challenge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          onClick={() => onChangeView("community")}
          className="group relative h-36 sm:h-44 rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer"
        >
          <img
            src="https://images.unsplash.com/photo-1662549905044-e3f71c293989?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncm91cCUyMGZpdG5lc3MlMjBmcmllbmRzJTIwc21pbGluZ3xlbnwxfHx8fDE3Njg3MDA1ODV8MA&ixlib=rb-4.1.0&q=80&w=1080"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            alt="Community"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-0 start-0 p-4 sm:p-5 text-white">
            <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-[10px] sm:text-xs font-bold text-yellow-400 uppercase tracking-wider">
                {t("dashboard.liveChallenge")}
              </span>
            </div>
            <h3 className="font-bold text-sm sm:text-base">{t("dashboard.stepChallenge")}</h3>
            <p className="text-white/70 text-[10px] sm:text-xs mt-0.5">
              {t("dashboard.joinCommunityChallenge")}
            </p>
          </div>
        </motion.div>

        {/* Grocery */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          onClick={() => onChangeView("grocery")}
          className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  {t("dashboard.grocery")}
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-200 group-hover:text-green-600 transition-colors rtl:rotate-180" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1">{t("dashboard.shoppingList")}</h3>
            {groceryProgress.total > 0 ? (
              <>
                <p className="text-slate-400 text-[10px] sm:text-xs mb-2.5 sm:mb-3">
                  {groceryProgress.total - groceryProgress.checked} {t("dashboard.itemsRemaining")}
                </p>
                <div className="h-1.5 sm:h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(groceryProgress.checked / groceryProgress.total) * 100}%`,
                    }}
                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
              </>
            ) : (
              <p className="text-slate-400 text-[10px] sm:text-xs">
                {t("dashboard.noItems")}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between mt-2.5 pt-1">
            <p className="text-[10px] sm:text-xs text-slate-400">
              {groceryProgress.checked} {t("dashboard.of")} {groceryProgress.total} {t("dashboard.checked")}
            </p>
            <p className="text-[10px] sm:text-xs font-bold text-emerald-600">
              {groceryProgress.total > 0
                ? Math.round(
                    (groceryProgress.checked / groceryProgress.total) * 100,
                  )
                : 0}
              %
            </p>
          </div>
        </motion.div>

        {/* Rewards */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          onClick={() => onChangeView("streaks")}
          className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl sm:rounded-3xl p-4 sm:p-5 cursor-pointer hover:scale-[1.015] transition-transform duration-200 relative overflow-hidden group flex flex-col justify-between"
        >
          <div className="absolute top-0 end-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -me-6 -mt-6" />
          <div className="absolute bottom-0 start-0 w-16 h-16 bg-red-400/30 rounded-full blur-xl -ms-4 -mb-4" />
          <div className="relative z-10 w-full h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Trophy className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-yellow-300" />
                  <span className="text-[10px] sm:text-xs font-bold text-orange-100 uppercase tracking-wider">
                    {t("dashboard.rewards")}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/50 group-hover:text-white transition-colors rtl:rotate-180" />
              </div>
              <h3 className="font-bold text-white text-lg sm:text-xl mb-0.5">
                {pointsData.current} {t("dashboard.pts")}
              </h3>
              <p className="text-orange-100 text-[10px] sm:text-xs mb-2.5 sm:mb-3">
                {pointsData.nextReward > 0
                  ? `${pointsData.nextReward} ${t("dashboard.ptsUntilBadge")}`
                  : t("dashboard.startEarning")}
              </p>
            </div>
            <div className="h-1.5 sm:h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${pointsData.nextReward > 0 ? (pointsData.current / pointsData.nextReward) * 100 : 0}%`,
                }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── AI Insight ── */}
      <AnimatePresence>
        {aiTipVisible && aiTipContent && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="bg-gradient-to-r from-slate-900 to-green-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 end-0 w-48 h-48 bg-green-600/20 rounded-full blur-3xl -me-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 start-1/2 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -mb-10 pointer-events-none" />

            <div className="flex items-start gap-3 sm:gap-4 relative z-10">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-700 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <span className="text-[10px] sm:text-xs font-bold text-green-300 uppercase tracking-wider">
                    {t("dashboard.aiDailyInsight")}
                  </span>
                  <span className="w-1.5 h-1.5 bg-green-400/60 rounded-full" />
                </div>
                <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
                  {aiTipContent}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setAiTipVisible(false)} className="text-white/40 hover:text-white/70 flex-shrink-0">
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-white/10 relative z-10">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
              <p className="text-[10px] sm:text-xs text-green-300 font-medium">
                {t("dashboard.aiInsightFooter")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
