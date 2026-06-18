import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Play,
  Clock,
  Award,
  Dumbbell,
  Zap,
  X,
  Sparkles,
  ArrowRight,
  Target,
  ChevronRight,
  Flame,
  CheckCircle2,
  BarChart3,
  Calendar,
  Loader2,
  FileDown,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  fitnessService,
  WorkoutSession,
  WorkoutPlan,
  Exercise,
} from "../services/fitnessService";
import { FitnessPlanLoader } from "./GeneratingLoaders";
import FitnessModal from "./FitnessModal";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api" || "/api";

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

const STORAGE_KEY = "njerka_fitness_preferences";

interface SavedPreferences {
  trainingDays: number;
  duration: number;
  trainingProgram:
    | "push_pull_legs"
    | "upper_lower"
    | "anterior_posterior"
    | "arnold_split"
    | "full_body";
}

export const Fitness: React.FC = () => {
  const { t } = useTranslation();
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [planView, setPlanView] = useState<"daily" | "weekly">("daily");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [hasPlan, setHasPlan] = useState(false);
  const [planEndDate, setPlanEndDate] = useState<string | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(
    new Set(),
  );
  const [showGifModal, setShowGifModal] = useState(false);
  const [currentGifUrl, setCurrentGifUrl] = useState("");
  const [currentExerciseName, setCurrentExerciseName] = useState("");
  const [gifLoading, setGifLoading] = useState(false);
  const [gifError, setGifError] = useState(false);

  const [trainingDays, setTrainingDays] = useState(3);
  const [duration, setDuration] = useState(60);
  const [trainingProgram, setTrainingProgram] = useState<
    | "push_pull_legs"
    | "upper_lower"
    | "anterior_posterior"
    | "arnold_split"
    | "full_body"
  >("full_body");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<Workout | null>(null);
  const [weeklySessions, setWeeklySessions] = useState<WeeklySession[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  const activeFilter = t("fitness.filterAll");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const prefs: SavedPreferences = JSON.parse(saved);
        setTrainingDays(prefs.trainingDays || 3);
        setDuration(prefs.duration || 60);
        setTrainingProgram(prefs.trainingProgram || "full_body");
      } catch (e) {
        console.error("Failed to load preferences:", e);
      }
    }
  }, []);

  // Save preferences
  const savePreferences = (
    days: number,
    dur: number,
    program:
      | "push_pull_legs"
      | "upper_lower"
      | "anterior_posterior"
      | "arnold_split"
      | "full_body",
  ) => {
    const prefs: SavedPreferences = {
      trainingDays: days,
      duration: dur,
      trainingProgram: program,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  };

  // Fetch workout plan
  const fetchWorkoutPlan = useCallback(
    async (view: "daily" | "weekly", silent = false) => {
      if (!silent) setLoading(true);
      try {
        const dateParam = view === "daily" ? "today" : "week";
        const response = await fitnessService.getCurrent({ date: dateParam });

        if (response.data && response.data.length > 0) {
          setHasPlan(true);
          setPlanEndDate(response.planEndDate || null);
          const sessions = response.data.map(
            (session: WorkoutSession): Workout => ({
              _id: session._id,
              title: session.name,
              type: session.type,
              duration: `${session.durationMin} min`,
              durationMin: session.durationMin,
              exercises: session.exercises || [],
              isCompleted: session.isCompleted || false,
              dayOfWeek: session.dayOfWeek,
              calories: session.exercises?.length
                ? Math.round(session.durationMin * 8)
                : 0,
            }),
          );

          // Find today's workout
          const today = new Date().toLocaleDateString("en-US", {
            weekday: "long",
          });
          const todaySession =
            sessions.find((s) => s.dayOfWeek === today) || sessions[0];
          setTodayWorkout(todaySession || null);

          // Build weekly sessions
          const weekDays = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ];
          const weekly: WeeklySession[] = weekDays.map((day) => {
            const session = sessions.find((s) => s.dayOfWeek === day);
            return {
              day: day.substring(0, 3),
              title: session?.title || t("fitness.restDay"),
              type: session?.type || "Rest",
              duration: session?.duration || "0 min",
              done: session?.isCompleted || false,
              session: session,
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
        console.error(
          "Failed to fetch workout plan:",
          (error as Error)?.message,
        );
        setHasPlan(false);
        setPlanEndDate(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Initial load - fetch on mount
  useEffect(() => {
    fetchWorkoutPlan("daily", true).catch(() => {
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
    setShowStyleModal(false);
    setIsGenerating(true);
    try {
      // Save preferences
      savePreferences(trainingDays, duration, trainingProgram);

      const response = await fitnessService.generate({
        duration,
        trainingDays,
        trainingProgram,
        startDate,
      });

      setWorkoutPlan(response.workoutPlan);
      setHasPlan(true);
      setHasGenerated(true);

      // Fetch the plan
      await fetchWorkoutPlan(planView);

      toast.success(t("fitness.planGenerated"));
    } catch (error) {
      console.error("Failed to generate plan:", error);
      toast.error(t("fitness.generateFailed"));
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle complete session (full session or specific exercises)
  const handleCompleteSession = async (
    sessionId: string,
    currentCompleted: boolean,
    exerciseIndices?: number[],
  ) => {
    const isPartialCompletion = exerciseIndices && exerciseIndices.length > 0;
    const prevWeekly = [...weeklySessions];
    const prevTodayWorkout = todayWorkout;

    // Find the session to check if it has exercises
    const session =
      weeklySessions.find((s) => s.session?._id === sessionId)?.session ||
      todayWorkout?._id === sessionId
        ? todayWorkout
        : null;
    const hasExercises =
      session && session.exercises && session.exercises.length > 0;

    // Optimistic update
    if (isPartialCompletion) {
      toast.success(
        `${exerciseIndices.length} exercise(s) marked as complete! +${exerciseIndices.length * 10} points`,
      );
    } else {
      setWeeklySessions(
        weeklySessions.map((s) =>
          s.session?._id === sessionId ? { ...s, done: !currentCompleted } : s,
        ),
      );
      if (todayWorkout?._id === sessionId) {
        setTodayWorkout({ ...todayWorkout, isCompleted: !currentCompleted });
      }
    }

    setCompletingId(sessionId);
    try {
      const data = isPartialCompletion ? { exerciseIndices } : undefined;
      const response = await fitnessService.completeSession(sessionId, data);

      // Update local state with response - handle cases where response might be different
      if (response && typeof response === "object") {
        const workoutPlan =
          "workoutPlan" in response ? (response as any).workoutPlan : null;

        if (
          workoutPlan &&
          workoutPlan.sessions &&
          Array.isArray(workoutPlan.sessions)
        ) {
          const updatedSessions = workoutPlan.sessions.map(
            (session: WorkoutSession): Workout => ({
              _id: session._id,
              title: session.name,
              type: session.type,
              duration: `${session.durationMin} min`,
              durationMin: session.durationMin,
              exercises: session.exercises || [],
              isCompleted: session.isCompleted || false,
              dayOfWeek: session.dayOfWeek,
              calories: session.exercises?.length
                ? Math.round(session.durationMin * 8)
                : 0,
            }),
          );

          const today = new Date().toLocaleDateString("en-US", {
            weekday: "long",
          });
          const todaySession =
            updatedSessions.find((s: any) => s.dayOfWeek === today) ||
            updatedSessions[0];
          setTodayWorkout(todaySession || null);

          const weekDays = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ];
          setWeeklySessions(
            weekDays.map((day) => {
              const session = updatedSessions.find(
                (s: any) => s.dayOfWeek === day,
              );
              return {
                day: day.substring(0, 3),
                title: session?.title || t("fitness.restDay"),
                type: session?.type || "Rest",
                duration: session?.duration || "0 min",
                done: session?.isCompleted || false,
                session: session,
              };
            }),
          );
        }
      }

      if (!isPartialCompletion) {
        toast.success(
          currentCompleted
            ? t("fitness.markedAsIncomplete")
            : t("fitness.sessionCompletePoints"),
        );
      }
    } catch (error: any) {
      console.error("Failed to complete session:", error);

      // For sessions without exercises (like Recovery), keep the optimistic update
      // as there's nothing for the API to actually mark complete
      if (!hasExercises && !isPartialCompletion) {
        toast.success(
          currentCompleted
            ? t("fitness.markedAsIncomplete")
            : t("fitness.sessionCompletePoints"),
        );
        return;
      }

      // Revert on error for sessions with exercises
      setWeeklySessions(prevWeekly);
      setTodayWorkout(prevTodayWorkout);

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update session";
      toast.error(errorMessage);
    } finally {
      setCompletingId(null);
    }
  };

  const typeConfig: Record<string, { bg: string; text: string; dot: string }> =
    {
      Strength: {
        bg: "bg-forest-canopy/15",
        text: "text-forest-canopy",
        dot: "bg-forest-canopy",
      },
      Cardio: {
        bg: "bg-orange-500/10",
        text: "text-orange-400",
        dot: "bg-orange-500",
      },
      Yoga: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        dot: "bg-emerald-500",
      },
      Mixed: { bg: "bg-teal-500/10", text: "text-teal-400", dot: "bg-teal-400" },
      Recovery: {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        dot: "bg-blue-500",
      },
      Rest: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground/50" },
    };

  // Calculate stats
  const completedSessions = weeklySessions.filter((s) => s.done).length;
  const totalSessions = weeklySessions.filter((s) => s.session).length;
  const totalCalories = weeklySessions.reduce(
    (acc, s) => acc + (s.session?.calories || 0),
    0,
  );
  const totalMinutes = weeklySessions.reduce(
    (acc, s) => acc + (s.session?.durationMin || 0),
    0,
  );

  const generationLock = (() => {
    if (!planEndDate)
      return { canGenerate: true, message: null as string | null };
    const unlockDate = new Date(planEndDate);
    unlockDate.setDate(unlockDate.getDate() + 1);
    if (new Date() >= unlockDate) return { canGenerate: true, message: null };
    return {
      canGenerate: false,
      message: t("fitness.generationLocked") + ` ${unlockDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    };
  })();

  const filteredUpcoming =
    activeFilter === t("fitness.filterAll")
      ? weeklySessions.filter((s) => s.session)
      : weeklySessions.filter((s) => s.session && s.type === activeFilter);

  return (
    <div className="space-y-7 relative">
      {/* Generate Plan Modal */}
      <AnimatePresence>
        {showStyleModal && (
          <FitnessModal
            onClose={() => setShowStyleModal(false)}
            trainingDays={trainingDays}
            setTrainingDays={setTrainingDays}
            duration={duration}
            setDuration={setDuration}
            trainingProgram={trainingProgram}
            setTrainingProgram={setTrainingProgram}
            startDate={startDate}
            setStartDate={setStartDate}
            isGenerating={isGenerating}
            onGenerate={handleGeneratePlan}
          />
        )}
      </AnimatePresence>

      {/* Workout Detail Modal */}
      <AnimatePresence>
        {selectedWorkout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed w-full h-full top-0 start-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="bg-card w-full h-full sm:max-w-2xl sm:h-auto sm:rounded-3xl overflow-hidden shadow-2xl sm:max-h-[88vh] flex flex-col"
            >
              <div className="relative h-32 sm:h-48 bg-slate-900 flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-forest-deep to-forest-canopy flex items-center justify-center">
                  <Dumbbell className="w-12 h-10 sm:w-20 sm:h-20 text-white/30" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                <button
                  onClick={() => {
                    setSelectedWorkout(null);
                    setCompletedExercises(new Set());
                  }}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-black/60 backdrop-blur-sm p-1.5 sm:p-2 rounded-full text-white hover:bg-black/50 transition-colors z-10"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 text-white">
                  <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <span
                      className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg ${typeConfig[selectedWorkout.type]?.bg || "bg-white/20"} ${typeConfig[selectedWorkout.type]?.text || "text-white"}`}
                    >
                      {selectedWorkout.type}
                    </span>
                  </div>
                  <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold leading-tight">
                    {selectedWorkout.title}
                  </h2>
                  <p className="opacity-80 text-xs sm:text-sm mt-0.5 sm:mt-1">
                    {selectedWorkout.duration}
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mb-4 sm:mb-6">
                  {[
                    {
                      label: t('fitness.duration'),
                      value: selectedWorkout.duration,
                      icon: Clock,
                    },
                    {
                      label: t('fitness.exercises'),
                      value: `${selectedWorkout.exercises?.length || 0} ${t('fitness.exerciseCount')}`,
                      icon: Dumbbell,
                    },
                    {
                      label: t('fitness.estBurn'),
                      value: `${selectedWorkout.calories || 0} ${t('fitness.caloriesWithUnit')}`,
                      icon: Flame,
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-muted rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center border border-border"
                    >
                      <s.icon className="w-3.5 h-3.5 text-forest-canopy mx-auto mb-1" />
                      <div className="font-bold text-card-foreground text-xs sm:text-sm">
                        {s.value}
                      </div>
                      <div className="text-[9px] sm:text-xs text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>

                <h3 className="font-bold text-card-foreground mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-forest-canopy" /> {t('fitness.routineBreakdown')}
                  {completedExercises.size > 0 && (
                    <span className="ms-2 text-[10px] sm:text-xs font-normal text-forest-canopy bg-forest-canopy/10 px-2 py-0.5 rounded-full">
                      {completedExercises.size} {t("fitness.selected")}
                    </span>
                  )}
                </h3>
                <div className="space-y-2.5 sm:space-y-3">
                  {(selectedWorkout.exercises || []).length > 0 ? (
                    selectedWorkout.exercises.map((ex, i) => {
                      const isCompleted = completedExercises.has(i);
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: i * 0.04,
                            duration: 0.2,
                            ease: [0.23, 1, 0.32, 1],
                          }}
                          className={`flex items-center justify-between p-2.5 sm:p-4 rounded-xl border transition-colors duration-150 cursor-pointer ${
                            isCompleted
                              ? "bg-forest-canopy/10 border-forest-canopy/30"
                              : "bg-muted border-border hover:border-forest-canopy/20 hover:bg-forest-canopy/15"
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
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 me-2">
                            <div
                              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-bold flex-shrink-0 transition-colors ${
                                isCompleted
                                  ? "bg-forest-canopy text-white"
                                  : "bg-forest-canopy/15 text-forest-canopy"
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                i + 1
                              )}
                            </div>
                            <div
                              className={`font-bold text-xs sm:text-sm truncate ${isCompleted ? "text-forest-canopy line-through" : "text-card-foreground"}`}
                            >
                              {ex.name}
                            </div>
                            {ex.gifUrl && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentGifUrl(ex.gifUrl!);
                                  setCurrentExerciseName(ex.name);
                                  setGifLoading(true);
                                  setGifError(false);
                                  setShowGifModal(true);
                                }}
                                className="p-1 sm:p-1.5 bg-forest-canopy/15 hover:bg-forest-canopy/20 rounded-lg transition-colors flex-shrink-0"
                                title={t("fitness.viewExerciseGif")}
                              >
                                <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-forest-canopy" />
                              </button>
                            )}
                          </div>
                          <div className="flex gap-1.5 sm:gap-3 text-[9px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-shrink-0">
                            <div className="flex flex-col items-center">
                              <span
                                className={`text-xs sm:text-base font-black ${isCompleted ? "text-forest-canopy" : "text-forest-canopy"}`}
                              >
                                {ex.sets}
                              </span>
                              <span className="text-[9px] sm:text-[10px]">{t("fitness.sets")}</span>
                            </div>
                            <div className="w-px bg-border" />
                            <div className="flex flex-col items-center">
                              <span
                                className={`text-xs sm:text-base font-black ${isCompleted ? "text-forest-canopy" : "text-forest-canopy"}`}
                              >
                                {ex.reps}
                              </span>
                              <span className="text-[9px] sm:text-[10px]">{t("fitness.reps")}</span>
                            </div>
                            <div className="w-px bg-border" />
                            <div className="flex flex-col items-center">
                              <span className="text-orange-500 text-xs sm:text-base font-black">
                                {ex.restSeconds || 60}s
                              </span>
                              <span className="text-[9px] sm:text-[10px]">{t("fitness.rest")}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No exercises
                    </div>
                  )}
                </div>

                {(() => {
                  const today = new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                  });
                  const isToday = selectedWorkout.dayOfWeek === today;
                  const isNotTodayMessage = !isToday && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 sm:mt-3 text-center">
                      {t("fitness.youCanOnlyCompleteToday")} (
                      {today})
                    </p>
                  );

                  return (
                    <>
                      {!selectedWorkout.isCompleted && (
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                          {completedExercises.size > 0 && (
                            <motion.button
                              whileHover={isToday ? { scale: 1.02 } : {}}
                              whileTap={isToday ? { scale: 0.98 } : {}}
                              onClick={() => {
                                const indices = Array.from(completedExercises);
                                handleCompleteSession(
                                  selectedWorkout._id,
                                  false,
                                  indices,
                                );
                                setSelectedWorkout(null);
                              }}
                              disabled={!isToday}
                              className={`flex-1 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold flex items-center justify-center gap-1.5 sm:gap-2 shadow-md transition-all text-xs sm:text-sm ${
                                isToday
                                  ? "bg-orange-500 hover:opacity-90 shadow-black/20"
                                  : "bg-muted cursor-not-allowed shadow-none"
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> {t("fitness.completeExercises")}{" "}
                              {completedExercises.size} {completedExercises.size > 1 ? t("fitness.completePlural") : t("fitness.completeSingle")}
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
                            className={`${completedExercises.size > 0 ? "flex-1" : "w-full"} text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold flex items-center justify-center gap-1.5 sm:gap-2 shadow-md transition-all text-xs sm:text-sm ${
                              isToday
                                ? "bg-gradient-to-r from-forest-deep to-forest-canopy rtl:bg-gradient-to-l hover:opacity-90 shadow-[0_0_20px_rgba(74,222,128,0.16)]"
                                : "bg-muted cursor-not-allowed shadow-none"
                            }`}
                          >
                            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> {t("fitness.markSessionComplete")}
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

      {/* GIF Modal */}
      <AnimatePresence>
        {showGifModal && currentGifUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed w-full min-h-screen top-0 start-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4"
            onClick={() => setShowGifModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="bg-card w-full h-screen sm:max-w-md sm:h-auto sm:rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-br from-forest-deep via-forest-canopy to-forest-deep p-4 text-white relative">
                <h3 className="text-lg font-bold text-center">
                  {currentExerciseName}
                </h3>
                <button
                  onClick={() => setShowGifModal(false)}
                  className="absolute top-3 right-3 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="p-4 flex items-center justify-center bg-muted min-h-[200px]">
                {gifLoading && (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-forest-canopy" />
                    <span className="text-sm text-muted-foreground">{t("fitness.loadingGif")}</span>
                  </div>
                )}
                {gifError && (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                      <Play className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <span className="text-sm">{t("fitness.imageNotAvailable")}</span>
                  </div>
                )}
                <img
                  src={currentGifUrl}
                  alt={currentExerciseName}
                  className={`max-h-[60vh] rounded-xl shadow-lg ${gifLoading || gifError ? "hidden" : ""}`}
                  onLoad={() => setGifLoading(false)}
                  onError={() => {
                    setGifLoading(false);
                    setGifError(true);
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground">
            Fitness Hub
          </h1>
          <p className="text-muted-foreground">
            Your AI-personalized training schedule.
          </p>
        </div>

        {hasPlan && (
          <div className="flex items-center gap-3 flex-wrap">
            {!isGenerating && (
              <div className="flex bg-card border border-border p-1 rounded-xl shadow-sm">
                <button
                  onClick={() => setPlanView("daily")}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${planView === "daily" ? "bg-green-500/20 text-green-400 shadow-sm" : "text-muted-foreground hover:text-card-foreground"}`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setPlanView("weekly")}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${planView === "weekly" ? "bg-green-500/20 text-green-400 shadow-sm" : "text-muted-foreground hover:text-card-foreground"}`}
                >
                  Weekly
                </button>
              </div>
            )}

            {!generationLock.canGenerate ? (
              <>
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 15px 35px -5px rgba(74,222,128,0.35)",
                  }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowStyleModal(true)}
                  disabled={isGenerating}
                  className="flex items-center gap-2 bg-gradient-to-r from-forest-deep to-forest-canopy rtl:bg-gradient-to-l text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-[0_20px_45px_-18px_rgba(74,222,128,0.55)] relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 rtl:bg-gradient-to-l -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <Sparkles className="w-4 h-4" />
                  {hasPlan ? t('fitness.regeneratePlan') : t('fitness.generateAIPlan')}
                </motion.button>
              </>
            ) : (
              <div className="relative group">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isGenerating}
                  className="flex items-center gap-2 bg-muted text-muted-foreground px-5 py-2.5 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  {hasPlan ? t('fitness.regeneratePlan') : t('fitness.generateAIPlan')}
                </motion.button>
                {generationLock.message && (
                  <div className="absolute end-0 top-full mt-2 px-4 py-3 bg-popover text-popover-foreground text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {generationLock.message}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isGenerating && (
              <button
                onClick={() =>
                  window.open(`${API_URL}/export/fitness/pdf`, "_blank")
                }
                disabled={!hasPlan}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-muted-foreground bg-card border border-border hover:bg-muted hover:text-forest-canopy hover:border-forest-canopy/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title={t("fitness.exportPdfTitle")}
              >
                <FileDown className="w-4 h-4" />
                <span className="hidden sm:inline">{t("fitness.pdf")}</span>
              </button>
            )}
          </div>
        )}
      </div>
      {isGenerating ? (
        <FitnessPlanLoader />
      ) : (
        <>
          {/* Weekly Stats Strip */}
          {hasPlan && !loading && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="bg-card rounded-2xl p-4 border border-forest-canopy/20 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 bg-forest-canopy/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-forest-canopy" />
                </div>
                <div>
                  <div className="font-bold text-card-foreground">
                    {completedSessions} / {totalSessions}
                  </div>
                  <div className="text-xs text-muted-foreground">{t("fitness.sessionsDone")}</div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.06,
                  duration: 0.25,
                  ease: [0.23, 1, 0.32, 1],
                }}
                className="bg-card rounded-2xl p-4 border border-orange-500/20 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <div className="font-bold text-card-foreground">
                    {totalCalories.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">{t("fitness.caloriesBurned")}</div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.12,
                  duration: 0.25,
                  ease: [0.23, 1, 0.32, 1],
                }}
                className="bg-card rounded-2xl p-4 border border-forest-canopy/20 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 bg-forest-canopy/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-forest-canopy" />
                </div>
                <div>
                  <div className="font-bold text-card-foreground">
                    {totalMinutes} min
                  </div>
                  <div className="text-xs text-muted-foreground">{t("fitness.activeMinutes")}</div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Empty State or Content */}
          {loading ? (
            <div className="bg-card rounded-3xl border border-border shadow-sm p-12 text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-forest-canopy" />
              <p className="text-muted-foreground">{t("fitness.loadingPlan")}</p>
            </div>
          ) : !hasPlan ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-forest-deep via-forest-canopy to-forest-deep p-6 sm:p-10 text-white text-center mt-8 sm:mt-12 md:mt-20"
            >
              <div className="absolute top-0 end-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -me-20 -mt-20 pointer-events-none" />
              <div className="absolute bottom-0 start-0 w-48 h-48 bg-forest-canopy/30 rounded-full blur-2xl -ms-10 -mb-10 pointer-events-none" />

              <div className="relative z-10">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: "easeInOut",
                  }}
                  className="w-14 h-14 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl"
                >
                  <Target className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
                </motion.div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">
                  {t("fitness.noPlanTitle")}
                </h2>
                <p className="text-xs sm:text-sm md:text-base text-forest-canopy/80 mb-6 sm:mb-8 max-w-xs sm:max-w-md mx-auto leading-relaxed">
                  {t("fitness.noPlanDesc")}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowStyleModal(true)}
                  className="cursor-pointer bg-card text-forest-canopy px-5 py-2.5 sm:px-8 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-lg flex items-center gap-2.5 sm:gap-3 mx-auto hover:bg-forest-canopy/10 transition-colors shadow-xl"
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t("fitness.buildMyPlan")}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div>
              <AnimatePresence mode="wait">
                {planView === "daily" ? (
                  <motion.div
                    key="daily"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    className="space-y-6"
                  >
                    {/* Hero Today Workout Card */}
                    {todayWorkout ? (
                      <motion.div
                        onClick={() => {
                          setSelectedWorkout(todayWorkout);
                          setCompletedExercises(new Set());
                        }}
                        whileHover={{ scale: 1.01 }}
                        className="relative h-80 rounded-3xl overflow-hidden group cursor-pointer shadow-xl"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-forest-deep to-forest-canopy">
                          <img
                            src={"/gym.jpg"}
                            alt={t("fitness.title")}
                            className="object-cover opacity-60"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />

                        <div className="absolute top-5 right-5 flex flex-col items-end gap-2">
                          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-orange-400" />
                            <span className="text-white text-xs font-bold">
                              Medium Intensity
                            </span>
                          </div>
                        </div>

                        <div className="absolute bottom-0 start-0 end-0 p-4 sm:p-8">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 text-white text-xs font-bold rounded-lg mb-4">
                            {todayWorkout.isCompleted ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> COMPLETED
                              </>
                            ) : (
                              <>
                                <motion.span
                                  animate={{ opacity: [1, 0.5, 1] }}
                                  transition={{ repeat: Infinity, duration: 2 }}
                                  className="w-1.5 h-1.5 bg-card rounded-full"
                                />{" "}
                                TODAY'S SESSION
                              </>
                            )}
                          </div>
                          <h2 className="text-4xl font-bold text-white mb-3">
                            {todayWorkout.title}
                          </h2>
                          <div className="flex flex-wrap gap-4 text-white/90 mb-5">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 opacity-70" />{" "}
                              {todayWorkout.duration}
                            </div>
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-yellow-400" />{" "}
                              {todayWorkout.calories} {t("fitness.caloriesWithUnit")}
                            </div>
                            <div className="flex items-center gap-2">
                              <Dumbbell className="w-4 h-4 opacity-70" />{" "}
                              {todayWorkout.exercises?.length || 0} {t("fitness.exercises")}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button className="bg-card text-card-foreground px-4 py-2 sm:px-7 sm:py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-muted transition-colors shadow-lg text-sm sm:text-xs sm:font-semibold">
                              <Play className="w-4 h-4 fill-current" /> {t("fitness.viewRoutine")}
                            </button>
                            {!todayWorkout.isCompleted && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompleteSession(
                                    todayWorkout._id,
                                    false,
                                  );
                                }}
                                disabled={completingId === todayWorkout._id}
                                className="text-white font-bold px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50 text-sm sm:text-base"
                              >
                                {completingId === todayWorkout._id ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  t("fitness.markComplete")
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="relative h-48 rounded-3xl overflow-hidden bg-muted flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <Dumbbell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p className="font-medium">
                              {t("fitness.noWorkoutToday")}
                            </p>
                        </div>
                      </div>
                    )}

                    {/* Upcoming Sessions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 bg-card p-6 rounded-3xl border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                          <h3 className="font-bold text-card-foreground flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-forest-canopy" /> {t("fitness.thisWeek")}
                          </h3>
                        </div>

                        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 sm:scrollbar-hide">
                          {[
                            t("fitness.filterAll"),
                            t("fitness.filterStrength"),
                            t("fitness.filterCardio"),
                            t("fitness.filterYoga"),
                            t("fitness.filterRecovery"),
                          ].map((f) => (
                            <button
                              key={f}
                              onClick={() => {}}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                                activeFilter === f
                                  ? "bg-green-500/20 text-green-400 ring-1 ring-green-500/30 shadow-[0_0_20px_rgba(74,222,128,0.12)]"
                                  : "bg-muted text-muted-foreground hover:bg-accent"
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
                              transition={{
                                delay: i * 0.04,
                                duration: 0.2,
                                ease: [0.23, 1, 0.32, 1],
                              }}
                              onClick={() =>
                                session.session &&
                                (setSelectedWorkout(session.session),
                                setCompletedExercises(new Set()))
                              }
                              className={`flex items-center gap-4 p-3.5 rounded-xl hover:bg-muted transition-colors duration-150 border border-transparent hover:border-border cursor-pointer group ${session.done ? "opacity-60" : ""}`}
                            >
                              <div
                                className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${session.done ? "bg-forest-canopy/15 text-forest-canopy" : "bg-muted text-muted-foreground group-hover:bg-forest-canopy/15 group-hover:text-forest-canopy transition-colors duration-150"}`}
                              >
                                {session.done ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                  session.day
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-card-foreground group-hover:text-forest-canopy transition-colors">
                                  {session.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeConfig[session.type]?.bg || "bg-muted"} ${typeConfig[session.type]?.text || "text-muted-foreground"}`}
                                  >
                                    {session.type}
                                  </span>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />{" "}
                                    {session.duration}
                                  </span>
                                </div>
                              </div>
                              <button className="p-2 text-muted-foreground group-hover:text-forest-canopy transition-colors">
                                <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Weekly Goal Card */}
                      <div className="bg-gray-800 border border-forest-canopy/20 p-6 rounded-3xl text-card-foreground relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 end-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -me-8 -mt-8" />
                        <div className="absolute bottom-0 start-0 w-20 h-20 bg-forest-canopy/20 rounded-full blur-xl -ms-5 -mb-5" />

                        <h3 className="font-bold mb-1 relative z-10 text-card-foreground">
                          Weekly Goal
                        </h3>
                        <p className="text-muted-foreground/70 text-xs mb-5 relative z-10">
                          Keep the momentum going!
                        </p>

                        <div className="flex items-end gap-2 mb-3 relative z-10">
                          <span className="text-5xl font-black text-card-foreground">
                            {completedSessions}
                          </span>
                          <span className="text-xl opacity-70 mb-1 text-muted-foreground">
                            / {totalSessions} {t("fitness.totalSessions")}
                          </span>
                        </div>

                        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden mb-2 relative z-10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0}%`,
                            }}
                            transition={{
                              delay: 0.3,
                              duration: 0.8,
                              ease: "easeOut",
                            }}
                            className="h-full bg-forest-canopy rounded-full shadow-[0_0_20px_rgba(74,222,128,0.24)]"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground/80 relative z-10 mb-6">
                          {totalSessions > 0
                            ? Math.round(
                                (completedSessions / totalSessions) * 100,
                              )
                            : 0}
                          % complete
                        </p>

                        <div className="space-y-2 relative z-10">
                          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => {
                            const daySessions = [
                              "Sunday",
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday",
                            ];
                            const isDone = weeklySessions[i]?.done;
                            const hasSession = weeklySessions[i]?.session;
                            return (
                              <div key={i} className="flex items-center gap-2">
                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isDone ? "bg-forest-canopy text-black" : hasSession ? "bg-forest-canopy/10 text-forest-canopy" : "bg-transparent"}`}
                                >
                                  {isDone && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                                  )}
                                </div>
                                <span
                                  className={`text-xs font-medium ${isDone ? "text-card-foreground" : hasSession ? "text-forest-canopy" : "text-white/30"}`}
                                >
                                  {d}
                                </span>
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
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    className="bg-card rounded-2xl sm:rounded-3xl border border-border shadow-sm overflow-hidden"
                  >
                    <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-card-foreground text-base sm:text-lg">
                          Weekly Training Plan
                        </h3>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                          Your full 7-day schedule at a glance
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-forest-canopy bg-forest-canopy/10 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl w-fit">
                        <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {completedSessions} /{" "}
                        {totalSessions} Done
                      </div>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {weeklySessions.map((session, i) => (
                        <motion.div
                          key={session.day}
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: i * 0.04,
                            duration: 0.2,
                            ease: [0.23, 1, 0.32, 1],
                          }}
                          onClick={() =>
                            session.session &&
                            (setSelectedWorkout(session.session),
                            setCompletedExercises(new Set()))
                          }
                          className={`flex items-center gap-3 sm:gap-4 p-3.5 sm:p-5 hover:bg-muted transition-colors duration-150 cursor-pointer group ${session.done ? "opacity-70" : ""}`}
                        >
                          <div
                            className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 transition-colors ${session.done ? "bg-forest-canopy/15 text-forest-canopy" : "bg-muted text-muted-foreground group-hover:bg-forest-canopy/15 group-hover:text-forest-canopy"}`}
                          >
                            {session.done ? (
                              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            ) : (
                              session.day
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4
                              className={`font-bold text-xs sm:text-sm truncate ${session.done ? "text-muted-foreground line-through" : "text-card-foreground group-hover:text-forest-canopy"} transition-colors`}
                            >
                              {session.title}
                            </h4>
                            <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                              <span
                                className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full ${typeConfig[session.type]?.bg || "bg-muted"} ${typeConfig[session.type]?.text || "text-muted-foreground"}`}
                              >
                                {session.type}
                              </span>
                              <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {session.duration}
                              </span>
                            </div>
                          </div>
                          {!session.done &&
                            session.session &&
                            (() => {
                              const today = new Date().toLocaleDateString(
                                "en-US",
                                { weekday: "long" },
                              );
                              const isToday =
                                session.session.dayOfWeek === today;
                              return (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCompleteSession(
                                      session.session!._id,
                                      false,
                                    );
                                  }}
                                  disabled={
                                    !isToday ||
                                    completingId === session.session._id
                                  }
                                  className={`text-[10px] sm:text-xs font-bold px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg transition-colors flex-shrink-0 ${
                                    isToday
                                      ? "text-forest-canopy bg-forest-canopy/10 hover:bg-forest-canopy/15"
                                      : "text-muted-foreground bg-muted cursor-not-allowed"
                                  } disabled:opacity-50`}
                                >
                                  {completingId === session.session._id ? (
                                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                                  ) : isToday ? (
                                    t("fitness.markDone")
                                  ) : (
                                    t("fitness.notToday")
                                  )}
                                </button>
                              );
                            })()}
                          <button className="p-1 sm:p-2 text-muted-foreground group-hover:text-forest-canopy transition-colors flex-shrink-0">
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 rtl:rotate-180" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
};
