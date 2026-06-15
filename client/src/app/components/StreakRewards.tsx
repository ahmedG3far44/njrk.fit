import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';
import {
  Flame,
  Calendar,
  Trophy,
  Gift,
  Shield,
  Share2,
  Check,
  Lock,
  Star,
  Loader2,
} from "lucide-react";

import {
  gamificationService,
  GamificationStatus,
} from "../services/gamificationService";

interface Milestone {
  days: number;
  reward: string;
  icon: typeof Star;
  unlocked: boolean;
}

interface StreakActivity {
  date: string;
  type: "check-in" | "freeze";
}

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseActivityDateKey = (value: string) => value.split("T")[0];

export const StreakRewards: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"status" | "rewards">("status");
  const [loading, setLoading] = useState(true);

  const [streakData, setStreakData] = useState<GamificationStatus>({
    currentStreak: 0,
    longestStreak: 0,
    lastCheckInDate: "",
    availableFreezes: 0,
    totalPoints: 0,
    pointsToRedeem: 0,
  });

  const [activityData, setActivityData] = useState<StreakActivity[]>([]);
  const [milestones] = useState<Milestone[]>([]);

  const { t } = useTranslation();

  useEffect(() => {
    const fetchStreakData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const [status, activity] = await Promise.all([
          gamificationService.getStatus(),
          gamificationService.getActivity({
            month: today.getMonth(),
            year: today.getFullYear(),
          }),
        ]);

        setStreakData(status);

        // Handle activity data - could be array or object with array property
        if (Array.isArray(activity)) {
          setActivityData(activity);
        } else if (activity && typeof activity === "object") {
          const activityArray =
            (activity as any).activities ||
            (activity as any).activity ||
            (activity as any).data ||
            [];
          setActivityData(Array.isArray(activityArray) ? activityArray : []);
        }
      } catch (error) {
        console.error("Failed to fetch streak data:", error);
        toast.error(t('streaks.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };

    fetchStreakData();
  }, []);

  // Get last 7 days status for the week display
  const getWeekDays = () => {
    const days = ["M", "T", "W", "T", "F", "S", "S"];
    const today = new Date();
    const todayKey = toDateKey(today);
    const activityKeys = new Set(
      activityData.map((activity) => parseActivityDateKey(activity.date)),
    );

    return days.map((day, i) => {
      // Calculate the day of week (Monday = 0 in our array)
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));
      const dateKey = toDateKey(date);

      let status: "complete" | "current" | "upcoming" = "upcoming";

      if (dateKey === todayKey) {
        status = "current";
      } else if (activityKeys.has(dateKey)) {
        status = "complete";
      }

      return { day, status };
    });
  };

  const weekDays = getWeekDays();

  const handleShare = () => {
    // confetti({
    //   particleCount: 100,
    //   spread: 70,
    //   origin: { y: 0.6 }
    // });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('streaks.title')}</h1>
          <p className="text-slate-500">
            {t('streaks.subtitle')}
          </p>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl font-bold hover:bg-green-100 transition-colors w-full sm:w-auto"
        >
          <Share2 className="w-5 h-5" />
          {t('streaks.shareStreak')}
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      )}

      {/* Main Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-xl shadow-orange-200">
        <div className="absolute top-0 end-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -me-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 start-0 w-48 h-48 bg-yellow-400/20 rounded-full blur-2xl -ms-12 -mb-12 pointer-events-none" />

        <div className="p-6 md:p-12 text-center relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center p-6 bg-white/20 backdrop-blur-md rounded-full mb-6 ring-4 ring-white/10"
          >
            <Flame className="w-16 h-16 text-yellow-300 fill-yellow-300" />
          </motion.div>

          <h2 className="text-5xl sm:text-6xl font-bold mb-2">
            {streakData.currentStreak} Days
          </h2>
          <p className="text-xl text-orange-100 font-medium mb-8">
            {streakData.currentStreak > 0
              ? t('streaks.onFire')
              : t('streaks.startStreak')}
          </p>

          <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-lg mx-auto">
            {weekDays.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold border-2 transition-all ${
                    d.status === "complete"
                      ? "bg-amber-100 text-orange-700 border-amber-100"
                      : d.status === "current"
                        ? "bg-green-600 border-white text-white ring-2 ring-green-200 ring-offset-2 ring-offset-orange-500"
                        : "bg-transparent border-white/30 text-white/50"
                  }`}
                >
                  {d.status === "complete" ? (
<Check className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    d.day
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer of Hero */}
        <div className="bg-black/10 backdrop-blur-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 px-4">
            <div className="p-2 bg-blue-400/20 rounded-lg text-blue-200">
              <Shield className="w-5 h-5" />
            </div>
            <div className="text-start">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-200">
                {t('streaks.streakFreeze')}
              </p>
              <p className="font-bold">
                {streakData.availableFreezes} {t('streaks.available')}
              </p>
            </div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex items-center gap-3 px-4">
            <div className="p-2 bg-yellow-400/20 rounded-lg text-yellow-200">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="text-start">
              <p className="text-xs font-bold uppercase tracking-wider text-yellow-200">
                {t('streaks.personalBest')}
              </p>
              <p className="font-bold">{streakData.longestStreak} {t('streaks.days')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("status")}
          className={`pb-4 px-4 font-bold transition-all relative ${
            activeTab === "status"
              ? "text-green-700"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {t('streaks.tabCalendar')}
          {activeTab === "status" && (
            <motion.div
              layoutId="tab"
              className="absolute bottom-0 start-0 end-0 h-0.5 bg-green-700"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("rewards")}
          className={`pb-4 px-4 font-bold transition-all relative ${
            activeTab === "rewards"
              ? "text-green-700"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {t('streaks.tabRewards')}
          {activeTab === "rewards" && (
            <motion.div
              layoutId="tab"
              className="absolute bottom-0 start-0 end-0 h-0.5 bg-green-700"
            />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "status" ? (
          <motion.div
            key="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Calendar */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-700" />
                  {t('streaks.activityLog')}
                </h3>
                <span className="text-sm font-semibold text-slate-500">
                  {activityData.length > 0
                    ? `${activityData.length} ${t('streaks.entries')}`
                    : t('streaks.thisMonth')}
                </span>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <div
                    key={i}
                    className="text-center text-xs font-bold text-slate-400 mb-2"
                  >
                    {d}
                  </div>
                ))}
                {(() => {
                  const today = new Date();
                  const currentDay = today.getDate();
                  const currentMonth = today.getMonth();
                  const currentYear = today.getFullYear();
                  const daysInMonth = new Date(
                    currentYear,
                    currentMonth + 1,
                    0,
                  ).getDate();
                  const activityByDate = new Map(
                    activityData.map((activity) => [
                      parseActivityDateKey(activity.date),
                      activity.type,
                    ]),
                  );

                  return Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNumber = i + 1;
                    const isToday = dayNumber === currentDay;
                    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
                    const activityType = activityByDate.get(dateKey);

                    const dayTitle = activityType
                      ? `${activityType === "freeze" ? t('streaks.freezeUsed') : t('streaks.checkIn')} on ${dateKey}`
                      : isToday
                        ? t('common.today')
                        : dateKey;

                    return (
                      <div
                        key={i}
                        title={dayTitle}
                        className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                          isToday
                            ? "bg-green-600 text-white ring-2 ring-green-300 ring-offset-1"
                            : activityType === "freeze"
                              ? "bg-blue-100 text-blue-700"
                              : activityType === "check-in"
                                ? "bg-amber-100 text-orange-700"
                                : "bg-slate-50 text-slate-400"
                        }`}
                      >
                        {dayNumber}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm font-medium">
                    {t('streaks.longestStreak')}
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {streakData.longestStreak} Days
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm font-medium">
                    {t('streaks.totalPoints')}
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {streakData.totalPoints.toLocaleString()} {t('streaks.pts')}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-2">{t('streaks.didYouKnow')}</h4>
                <p className="text-sm text-blue-700 leading-relaxed">
                  {t('streaks.didYouKnowText')}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="rewards"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-4"
          >
            {milestones.length > 0 ? (
              milestones.map((milestone, i) => (
                <div
                  key={i}
                  className={`group relative p-6 rounded-2xl border transition-all ${
                    milestone.unlocked
                      ? "bg-white border-green-200 shadow-sm"
                      : "bg-slate-50 border-slate-100 opacity-80"
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
                        milestone.unlocked
                          ? "bg-green-100 text-green-600"
                          : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      <milestone.icon className="w-8 h-8" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3
                          className={`text-lg font-bold ${milestone.unlocked ? "text-slate-900" : "text-slate-500"}`}
                        >
                          {milestone.reward}
                        </h3>
                        {milestone.unlocked ? (
                          <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> {t('streaks.unlocked')}
                          </span>
                        ) : (
                          <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <Lock className="w-3 h-3" /> {t('streaks.locked')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {t('streaks.reachA')}{" "}
                        <span className="font-bold">{milestone.days} {t('streaks.day')}</span>{" "}
                        {t('streaks.streak')}
                      </p>
                    </div>

                    {!milestone.unlocked && (
                      <div className="hidden md:block">
                        <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-600"
                            style={{
                              width: `${(streakData.currentStreak / milestone.days) * 100}%`,
                            }}
                          />
                        </div>
                        <p className="text-end text-xs text-slate-400 mt-1 font-mono">
                          {streakData.currentStreak}/{milestone.days}
                        </p>
                      </div>
                    )}

                    {milestone.unlocked && (
                      <button className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-green-800 transition-colors">
                        {t('streaks.claim')}
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center text-slate-400">
                <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">{t('streaks.noRewards')}</p>
                <p className="text-sm">
                  {t('streaks.keepStreaking')}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
