import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, X, Brain, Send, Scale, Sparkles, Check, Lock, Calendar, Footprints, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { progressService, CanUpdateResponse } from '../services/progressService';
import { gamificationService } from '../services/gamificationService';
import { nutritionService } from '../services/nutritionService';
import { fitnessService } from '../services/fitnessService';
import { useAuth } from '../context/AuthProvider';
import { googleFitService, GoogleFitWeeklyStepsResponse } from '../services/googleFitService';

interface WeightEntry {
  date: string;
  weight: number;
}

export const Progress: React.FC = () => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [currentWeight, setCurrentWeight] = useState('');
  const [aiFeeling, setAiFeeling] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const { user, isGoogleUser } = useAuth();

  const getGoalDurationDays = () => {
    if (!user?.goalDate) return 120;
    const startDate = user.createdAt ? new Date(user.createdAt) : new Date();
    const endDate = new Date(user.goalDate);
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 120;
  };

  const [weightData, setWeightData] = useState<WeightEntry[]>([]);
  const [canUpdateInfo, setCanUpdateInfo] = useState<CanUpdateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7days' | '30days' | '7weeks'>('7weeks');
  const [streakDays, setStreakDays] = useState(0);
  const [avgProtein, setAvgProtein] = useState(0);
  const [weightLost, setWeightLost] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [googleFitData, setGoogleFitData] = useState<GoogleFitWeeklyStepsResponse | null>(null);
  const [googleFitLoading, setGoogleFitLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      try {
        const [dashboardRes, canUpdateRes] = await Promise.all([
          progressService.getDashboard({ timeframe }),
          progressService.canUpdate()
        ]);

        if (dashboardRes.weightTrend) {
          const formattedData: WeightEntry[] = dashboardRes.weightTrend.map(item => ({
            date: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            weight: item.weightKg || 0
          }));
          setWeightData(formattedData);

          if (dashboardRes.weightTrend.length >= 2) {
            const first = dashboardRes.weightTrend[0].weightKg || 0;
            const last = dashboardRes.weightTrend[dashboardRes.weightTrend.length - 1].weightKg || 0;
            const lost = first - last;
            setWeightLost(lost > 0 ? Math.round(lost * 10) / 10 : 0);
          }
        }

        setCanUpdateInfo(canUpdateRes);
      } catch (error) {
        console.error('Error fetching progress data:', error);
      }

      try {
        const streakRes = await gamificationService.getStatus();
        if (streakRes) setStreakDays(streakRes.currentStreak || 0);
      } catch (error) {
        console.error('Error fetching streak:', error);
      }

      try {
        const nutritionRes = await nutritionService.getCurrent({ date: 'week' });
        if (nutritionRes?.meals?.length > 0) {
          const totalProtein = nutritionRes.meals.reduce((sum: number, meal: any) => sum + (meal.macros?.protein || 0), 0);
          const uniqueDays = new Set(nutritionRes.meals.map((m: any) => m.day));
          setAvgProtein(Math.round(totalProtein / Math.max(uniqueDays.size, 1)));
        }
      } catch (error) {
        console.error('Error fetching nutrition:', error);
      }

      try {
        const fitnessRes = await fitnessService.getCurrent({ date: 'week' });
        if (fitnessRes?.data && Array.isArray(fitnessRes.data)) {
          setTotalWorkouts(fitnessRes.data.filter((s: any) => s.isCompleted).length);
        }
      } catch (error) {
        console.error('Error fetching fitness:', error);
      }

      if (isGoogleUser) {
        setGoogleFitLoading(true);
        try {
          const fitData = await googleFitService.getWeeklySteps();
          setGoogleFitData(fitData);
        } catch (error) {
          console.error('Error fetching Google Fit data:', error);
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
        source: 'manual'
      });

      navigate('/dashboard/progress', { replace: true });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setShowUpdateModal(false);
        setCurrentWeight('');
        setAiFeeling('');
      }, 2000);
    } catch (error) {
      console.error('Error submitting progress:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeframeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeframe(e.target.value as '7days' | '30days' | '7weeks');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your Progress</h1>
          <p className="text-slate-500">Track your journey to a healthier you.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeframe}
            onChange={handleTimeframeChange}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg outline-none text-sm"
          >
            <option value="7weeks">Last 7 Weeks</option>
            <option value="30days">Last Month</option>
            <option value="7days">Last 7 Days</option>
          </select>
          {canUpdateInfo?.canUpdate ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUpdateModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-green-800 to-green-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-green-200 hover:opacity-90 transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              Update My Stats
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
                Update My Stats
              </motion.button>
              {canUpdateInfo && (
                <div className="absolute right-0 top-full mt-2 px-4 py-3 bg-slate-800 text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {canUpdateInfo.message}
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
            className="fixed min-h-screen w-full left-0 top-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setShowUpdateModal(false)}
          >
            <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-12 text-center"
                >
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Stats Updated!</h3>
                  <p className="text-slate-500">Your AI plan is being recalibrated based on your update.</p>
                </motion.div>
              ) : (
                <>
                  <div className="bg-gradient-to-r from-slate-900 to-green-900 p-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white text-lg">Update My Stats</h3>
                      <p className="text-slate-400 text-sm">Log your current state for the AI to recalibrate</p>
                    </div>
                    <button onClick={() => setShowUpdateModal(false)} className="p-2 text-slate-400 hover:text-white transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Current Weight */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Scale className="w-4 h-4 text-green-700" /> Current Weight (kg)
                      </label>
                      <input
                        type="number"
                        value={currentWeight}
                        onChange={e => setCurrentWeight(e.target.value)}
                        placeholder="e.g. 76.5"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-600 outline-none text-sm transition-all"
                        step="0.1"
                      />
                    </div>

                    {/* AI Feeling */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-green-700" /> Tell the AI How You Feel
                      </label>
                      <div className="relative">
                        <textarea
                          value={aiFeeling}
                          onChange={e => setAiFeeling(e.target.value)}
                          rows={3}
                          placeholder='e.g. "I feel more energetic but my muscles hurt after leg day. I think I need more recovery time..."'
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-600 outline-none text-sm resize-none transition-all pr-12"
                        />
                        <Sparkles className="absolute right-3 bottom-3 w-4 h-4 text-green-400" />
                      </div>
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={(!currentWeight && !aiFeeling) || isSubmitting}
                      className="w-full py-4 bg-gradient-to-r from-green-800 to-green-700 text-white rounded-xl font-bold disabled:opacity-40 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> Updating your plan...</>
                      ) : (
                        <><Send className="w-5 h-5" /> Submit Update</>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Weight Trend (kg)</h3>
          <div className="h-[240px] w-full min-w-0">
            {weightData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightData}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#166534" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#166534" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="weight" stroke="#166534" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="font-medium">No weight data yet</p>
                  <p className="text-sm">Update your stats to see trends</p>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* Activity Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Daily Steps</h3>
          <div className="h-[240px] w-full min-w-0">
            {isGoogleUser && googleFitData?.connected && googleFitData.steps.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={googleFitData.steps} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="steps" radius={[6, 6, 6, 6]}>
                    {googleFitData.steps.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#14532d', '#166534', '#15803d', '#16a34a', '#22c55e', '#4ade80', '#86efac'][index % 7]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : isGoogleUser && googleFitLoading ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-8 h-8 border-2 border-green-700/30 border-t-green-700 rounded-full" />
              </div>
            ) : isGoogleUser && googleFitData?.connected ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <Smartphone className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="font-medium">No step data from Google Fit</p>
                  <p className="text-sm">Sync your device and try again</p>
                </div>
              </div>
            ) : isGoogleUser ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center mb-4">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Footprints className="w-7 h-7 text-green-700" />
                  </div>
                  <p className="font-medium text-slate-700">Track Your Steps</p>
                  <p className="text-sm text-slate-400">Connect Google Fit to see your daily steps</p>
                </div>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href={`${import.meta.env.VITE_API_BASE_URL || ''}/auth/google/fit-connect`}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-green-800 to-green-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-green-200 hover:opacity-90 transition-all text-sm"
                >
                  <Smartphone className="w-4 h-4" /> Connect Google Fit
                </motion.a>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center mb-3">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Footprints className="w-7 h-7 text-green-700" />
                  </div>
                  <div className="text-3xl font-bold text-slate-900">
                    {((user?.estimatedSteps || 5000)).toLocaleString()}
                  </div>
                  <div className="text-slate-500 text-sm">Daily Steps Goal</div>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <div className="text-sm font-bold text-green-700">{(user?.estimatedSteps || 5000).toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500">Daily Steps</div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <div className="text-sm font-bold text-amber-600">
                      {((user?.estimatedSteps || 5000) * getGoalDurationDays()).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500">Total Steps ({getGoalDurationDays()} days)</div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" /> Sign in with Google to track real steps
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Workouts', val: String(totalWorkouts), change: '', color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Weight Lost', val: `${weightLost > 0 ? weightLost : 0} kg`, change: '', color: 'text-green-600', bg: 'bg-green-50' },
          isGoogleUser && googleFitData?.connected
            ? { label: 'Avg. Steps', val: `${googleFitData.avgSteps.toLocaleString()}`, change: '', color: 'text-emerald-600', bg: 'bg-emerald-50' }
            : { label: 'Daily Goal', val: `${(user?.estimatedSteps || 5000).toLocaleString()}`, change: '', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Avg. Protein', val: `${avgProtein > 0 ? avgProtein : 0}g`, change: '', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Streak Days', val: String(streakDays), change: '', color: 'text-orange-500', bg: 'bg-orange-50' },
        ].filter(Boolean).map((stat: any) => (
          <motion.div
            key={stat.label}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm cursor-default"
          >
            <div className="text-sm text-slate-500 font-medium mb-2">{stat.label}</div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{stat.val}</div>
            {stat.change && (
              <div className={`text-sm font-bold ${stat.color} ${stat.bg} px-2 py-0.5 rounded-lg inline-block`}>{stat.change}</div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
