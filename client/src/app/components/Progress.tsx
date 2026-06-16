import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  TrendingUp,
  X,
  Brain,
  Send,
  Scale,
  Sparkles,
  Check,
  Lock,
  Calendar,
  Footprints,
  Smartphone,
  Dumbbell,
  Target,
  Flame,
  TrendingDown,
} from "lucide-react";
import { BeefIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  progressService,
  CanUpdateResponse,
} from "../services/progressService";
import { gamificationService } from "../services/gamificationService";
import { nutritionService } from "../services/nutritionService";
import { fitnessService } from "../services/fitnessService";
import { useAuth } from "../context/AuthProvider";
import { Button } from "./ui/button";
import {
  googleFitService,
  GoogleFitWeeklyStepsResponse,
} from "../services/googleFitService";

interface WeightEntry {
  date: string;
  weight: number;
}

export const Progress: React.FC = () => {
  const { t } = useTranslation();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [currentWeight, setCurrentWeight] = useState("");
  const [aiFeeling, setAiFeeling] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const { user, isGoogleUser } = useAuth();

  const parseDateValue = (value: unknown): Date | null => {
    if (value instanceof Date) return value;
    if (typeof value === "string" || typeof value === "number") {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    return null;
  };

  const getGoalDurationDays = () => {
    const startDate = user?.createdAt
      ? parseDateValue(user.createdAt)
      : new Date();
    const goalDate = user?.goalDate ? parseDateValue(user.goalDate) : null;
    if (!goalDate) return 120;

    const validStartDate = startDate || new Date();
    const diffTime = goalDate.getTime() - validStartDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 120;
  };

  const [weightData, setWeightData] = useState<WeightEntry[]>([]);
  const [canUpdateInfo, setCanUpdateInfo] = useState<CanUpdateResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7days' | '30days' | '7weeks'>(
    '7weeks',
  );
  const [streakDays, setStreakDays] = useState(0);
  const [avgProtein, setAvgProtein] = useState(0);
  const [weightLost, setWeightLost] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [googleFitData, setGoogleFitData] =
    useState<GoogleFitWeeklyStepsResponse | null>(null);
  const [googleFitLoading, setGoogleFitLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      try {
        const [dashboardRes, canUpdateRes] = await Promise.all([
          progressService.getDashboard({ timeframe }),
          progressService.canUpdate(),
        ]);

        if (dashboardRes.weightTrend) {
          const formattedData: WeightEntry[] = dashboardRes.weightTrend.map(
            (item) => ({
              date: new Date(item._id).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
              weight: item.weightKg || 0,
            }),
          );
          setWeightData(formattedData);

          if (dashboardRes.weightTrend.length >= 2) {
            const first = dashboardRes.weightTrend[0].weightKg || 0;
            const last =
              dashboardRes.weightTrend[dashboardRes.weightTrend.length - 1]
                .weightKg || 0;
            const lost = first - last;
            setWeightLost(lost > 0 ? Math.round(lost * 10) / 10 : 0);
          }
        }

        setCanUpdateInfo(canUpdateRes);
      } catch (error) {
        console.error("Error fetching progress data:", error);
      }

      try {
        const streakRes = await gamificationService.getStatus();
        if (streakRes) setStreakDays(streakRes.currentStreak || 0);
      } catch (error) {
        console.error("Error fetching streak:", error);
      }

      try {
        const nutritionRes = await nutritionService.getCurrent({
          date: "week",
        });
        if (nutritionRes?.meals?.length > 0) {
          const totalProtein = nutritionRes.meals.reduce(
            (sum: number, meal: any) => sum + (meal.macros?.protein || 0),
            0,
          );
          const uniqueDays = new Set(nutritionRes.meals.map((m: any) => m.day));
          setAvgProtein(
            Math.round(totalProtein / Math.max(uniqueDays.size, 1)),
          );
        }
      } catch (error) {
        console.error("Error fetching nutrition:", error);
      }

      try {
        const fitnessRes = await fitnessService.getCurrent({ date: "week" });
        if (fitnessRes?.data && Array.isArray(fitnessRes.data)) {
          setTotalWorkouts(
            fitnessRes.data.filter((s: any) => s.isCompleted).length,
          );
        }
      } catch (error) {
        console.error("Error fetching fitness:", error);
      }

      if (isGoogleUser) {
        setGoogleFitLoading(true);
        try {
          const fitData = await googleFitService.getWeeklySteps();
          setGoogleFitData(fitData);
        } catch (error) {
          console.error("Error fetching Google Fit data:", error);
          setGoogleFitData({ connected: false, steps: [], avgSteps: 0 });
        } finally {
          setGoogleFitLoading(false);
        }
      }

      setIsLoading(false);
    };

    fetchData();
  }, [timeframe, submitted, isGoogleUser]);

  const handleSubmit = async () => {
    if (!currentWeight && !aiFeeling) return;
    setIsSubmitting(true);

    try {
      await progressService.log({
        weightKg: currentWeight ? parseFloat(currentWeight) : undefined,
        notes: aiFeeling || undefined,
        source: "manual",
      });

      navigate("/dashboard/progress", { replace: true });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setShowUpdateModal(false);
        setCurrentWeight("");
        setAiFeeling("");
      }, 2000);
    } catch (error) {
      console.error("Error submitting progress:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeframeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeframe(e.target.value as '7days' | '30days' | '7weeks');
  };

  return (
    <div className="space-y-4 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
            {t("progress.title")}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            {t("progress.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3 sm:items-end">
          {canUpdateInfo?.canUpdate ? (
            <Button variant="primary" size="sm" onClick={() => setShowUpdateModal(true)}>
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {t("progress.updateStats")}
            </Button>
          ) : (
            <div className="relative group w-fit">
              <Button variant="secondary" size="sm" disabled>
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {t("progress.updateStats")}
              </Button>
              {canUpdateInfo && (
                <div className="absolute end-0 top-full mt-2 px-3.5 py-2.5 bg-slate-800 text-white text-xs rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {t("progress.progressTooltip")}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showUpdateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed h-full w-full start-0 top-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) =>
              e.target === e.currentTarget && setShowUpdateModal(false)
            }
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="bg-white w-full h-full sm:max-w-lg sm:h-auto sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-8 sm:p-12 text-center my-auto"
                >
                  <div className="w-16 h-14 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Check className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1.5 sm:mb-2">
                    {t("progress.statsUpdated")}
                  </h3>
                  <p className="text-slate-500 text-xs sm:text-sm">
                    {t("progress.statsUpdatedDesc")}
                  </p>
                </motion.div>
              ) : (
                <>
                  <div className="bg-gradient-to-r from-slate-900 to-green-900 p-4 sm:p-6 flex items-center justify-between flex-shrink-0">
                    <div>
                      <h3 className="font-bold text-white text-base sm:text-lg">
                        {t("progress.updateStatsTitle")}
                      </h3>
                      <p className="text-slate-400 text-xs sm:text-sm">
                        {t("progress.updateStatsSubtitle")}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowUpdateModal(false)}>
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </div>

                  <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1 overflow-y-auto">
                    {/* Current Weight */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-700" /> {t("progress.currentWeight")}
                      </label>
                      <input
                        type="number"
                        value={currentWeight}
                        onChange={(e) => setCurrentWeight(e.target.value)}
                        placeholder={t("progress.weightPlaceholder")}
                        className="w-full px-3.5 py-2.5 rounded-lg sm:rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-600 outline-none text-xs sm:text-sm transition-all bg-white"
                        step="0.1"
                      />
                    </div>

                    {/* AI Feeling */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-700" /> {t("progress.tellAiHowYouFeel")}
                      </label>
                      <div className="relative">
                        <textarea
                          value={aiFeeling}
                          onChange={(e) => setAiFeeling(e.target.value)}
                          rows={3}
                          placeholder={t("progress.feelingPlaceholder")}
                          className="w-full px-3.5 py-2.5 rounded-lg sm:rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-600 outline-none text-xs sm:text-sm resize-none transition-all pr-10"
                        />
                        <Sparkles className="absolute right-2.5 bottom-2.5 w-3.5 h-3.5 text-green-400" />
                      </div>
                    </div>

                    <Button variant="primary" size="lg" loading={isSubmitting} className="w-full" onClick={handleSubmit}>
                      {isSubmitting ? (
                        t("progress.updatingPlan")
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 sm:w-5 sm:h-5" /> {t("progress.submitUpdate")}
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Weight Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-4 sm:mb-6">{t("progress.weightTrend")}</h3>
          <div className="h-[200px] sm:h-[240px] w-full min-w-0">
            {weightData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightData}>
                  <defs>
                    <linearGradient
                      id="colorWeight"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#166534" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#166534" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    dy={10}
                  />
                  <YAxis
                    domain={["dataMin - 1", "dataMax + 1"]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="#166534"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorWeight)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-30" />
                  <p className="font-medium text-xs sm:text-sm">{t("progress.noWeightData")}</p>
                  <p className="text-[10px] sm:text-sm">{t("progress.updateToSeeTrends")}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Activity Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-4 sm:mb-6">{t("progress.dailySteps")}</h3>
          <div className="h-[200px] sm:h-[240px] w-full min-w-0">
            {isGoogleUser &&
            googleFitData?.connected &&
            googleFitData.steps.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={googleFitData.steps} barSize={24}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    dy={10}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar dataKey="steps" radius={[4, 4, 4, 4]}>
                    {googleFitData.steps.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          [
                            "#14532d",
                            "#166534",
                            "#15803d",
                            "#16a34a",
                            "#22c55e",
                            "#4ade80",
                            "#86efac",
                          ][index % 7]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : isGoogleUser && googleFitLoading ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-green-700/30 border-t-green-700 rounded-full"
                />
              </div>
            ) : isGoogleUser && googleFitData?.connected ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <Smartphone className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-30" />
                  <p className="font-medium text-xs sm:text-sm">{t("progress.noStepData")}</p>
                  <p className="text-[10px] sm:text-sm">{t("progress.syncDevice")}</p>
                </div>
              </div>
            ) : isGoogleUser ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 flex-shrink-0">
                    <Footprints className="w-5 h-5 sm:w-7 sm:h-7 text-green-700" />
                  </div>
                  <p className="font-medium text-xs sm:text-sm text-slate-700">{t("progress.trackYourSteps")}</p>
                  <p className="text-[10px] sm:text-xs text-slate-400">
                    {t("progress.connectGoogleFit")}
                  </p>
                </div>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href={`${import.meta.env.VITE_API_BASE_URL || ""}/auth/google/fit-connect`}
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-green-800 to-green-700 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl font-bold shadow-md shadow-green-200 hover:opacity-90 transition-all text-xs sm:text-sm"
                >
                  <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t("progress.connectGoogleFitButton")}
                </motion.a>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-2">
                <div className="text-center mb-2.5 sm:mb-3">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 flex-shrink-0">
                    <Footprints className="w-5 h-5 sm:w-7 sm:h-7 text-green-700" />
                  </div>
                  <div className="text-xl sm:text-3xl font-black text-slate-900 leading-none">
                    {(user?.estimatedSteps || 5000).toLocaleString()}
                  </div>
                  <div className="text-slate-500 text-[10px] sm:text-sm mt-1">{t("progress.dailyStepsGoal")}</div>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full max-w-xs px-2">
                  <div className="bg-green-50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                    <div className="text-xs sm:text-sm font-bold text-green-700">
                      {(user?.estimatedSteps || 5000).toLocaleString()}
                    </div>
                    <div className="text-[8px] sm:text-[10px] text-slate-500">
                      {t("progress.dailySteps")}
                    </div>
                  </div>
                  <div className="bg-amber-50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                    <div className="text-xs sm:text-sm font-bold text-amber-600 truncate">
                      {(
                        (user?.estimatedSteps || 5000) * getGoalDurationDays()
                      ).toLocaleString()}
                    </div>
                    <div className="text-[8px] sm:text-[10px] text-slate-500">
                      {t("progress.totalSteps")} ({getGoalDurationDays()}d)
                    </div>
                  </div>
                </div>
                <p className="text-[9px] sm:text-xs text-slate-400 mt-2.5 sm:mt-3 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" /> {t("progress.signInForSteps")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          {
            label: t('progress.totalWorkouts'),
            val: String(totalWorkouts),
            icon: <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />,
            change:
              totalWorkouts === 0
                ? t("progress.noWorkouts")
                : totalWorkouts > 0
                  ? `+${totalWorkouts} ${t("progress.thisWeek")}`
                  : `${totalWorkouts} ${t("progress.thisWeek")}`,
            changeColor: "text-green-500",
            bg: "bg-green-100",
            changeIcon: <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />,
          },
          {
            label: t('progress.weightLost'),
            val: `${weightLost > 0 ? weightLost : 0} kg`,
            icon: <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />,
            change:
              weightLost === 0
                ? t("progress.noChange")
                : weightLost > 0
                  ? `-${weightLost} kg`
                  : `+${Math.abs(weightLost)} kg`,
            changeColor: weightLost > 0 ? "text-green-500" : "text-red-500",
            bg: weightLost > 0 ? "bg-green-100" : "bg-red-100",
            changeIcon:
              weightLost > 0 ? (
                <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              ),
          },
          isGoogleUser && googleFitData?.connected
            ? {
                label: t('progress.avgSteps'),
                val: `${googleFitData.avgSteps.toLocaleString()}`,
                icon: <Footprints className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />,
                change: t('progress.stepsOnTrack'),
                changeColor: "text-green-500",
                note: t('progress.stepsOnTrack'),
                bg: "bg-green-100",
                changeIcon: <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />,
              }
            : {
                label: t('progress.dailyGoal'),
                val: `${(user?.estimatedSteps || 5000).toLocaleString()}`,
                icon: <Target className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />,
                change: t('progress.onTrack'),
                note: t('progress.stepsOnTrack'),
                changeColor: "text-green-500",
                bg: "bg-green-100",
                changeIcon: <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />,
              },
          {
            label: t('progress.avgProtein'),
            val: `${avgProtein > 0 ? avgProtein : 0}g`,
            icon: <BeefIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />,
            change: t('progress.aboveAvg'),
            changeColor: "text-green-500",
            note: t('progress.keepItUp'),
            bg: "bg-green-100",
            changeIcon: <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />,
          },
          {
            label: t('progress.dailyStreaks'),
            val: String(streakDays),
            icon: <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />,
            change: `+${streakDays} ${t("progress.day")}`,
            changeColor: "text-green-500",
            note: t('progress.keepItUp'),
            bg: "bg-green-100",
            changeIcon: <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />,
          },
        ]
          .filter(Boolean)
          .map((stat: any) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm cursor-default flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 font-semibold mb-1.5 sm:mb-2 gap-2">
                  <span className="truncate">{stat.label}</span>
                  {stat.icon}
                </div>
                <div className="text-base sm:text-2xl font-black text-slate-900 leading-tight">
                  {stat.val}
                </div>
              </div>

              {stat.change && (
                <div className="text-[10px] sm:text-xs text-slate-400 mt-2 sm:mt-3 flex flex-col gap-0.5 sm:gap-1">
                  <div
                    className={`flex items-center gap-1 ${stat.changeColor} font-bold text-[10px] sm:text-xs`}
                  >
                    {stat.changeIcon}
                    <span className="truncate">{stat.change === 0 ? t("progress.noChange") : stat.change}</span>
                  </div>
                  {stat.note && (
                    <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1 sm:mt-1.5 leading-normal">{stat.note}</p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
      </div>
    </div>
  );
};
