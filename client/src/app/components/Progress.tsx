import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, Upload, X, Brain, Send, Scale, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WeightEntry {
  date: string;
  weight: number;
}

interface ActivityEntry {
  name: string;
  steps: number;
  color: string;
}

export const Progress: React.FC = () => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [currentWeight, setCurrentWeight] = useState('');
  const [aiFeeling, setAiFeeling] = useState('');
  const [inbodyFile, setInbodyFile] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [weightData, setWeightData] = useState<WeightEntry[]>([]);
  const [activityData] = useState<ActivityEntry[]>([]);

  const handleSubmit = () => {
    if (!currentWeight && !aiFeeling) return;
    setIsSubmitting(true);
    setTimeout(() => {
      if (currentWeight) {
        setWeightData(prev => [
          ...prev,
          { date: `Week ${prev.length + 1}`, weight: parseFloat(currentWeight) }
        ]);
      }
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setShowUpdateModal(false);
        setCurrentWeight('');
        setAiFeeling('');
        setInbodyFile(null);
      }, 2000);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your Progress</h1>
          <p className="text-slate-500">Track your journey to a healthier you.</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg outline-none text-sm">
            <option>Last 7 Weeks</option>
            <option>Last Month</option>
            <option>This Year</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowUpdateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-green-800 to-green-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-green-200 hover:opacity-90 transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            Update My Stats
          </motion.button>
        </div>
      </div>

      {/* Update Stats Modal */}
      <AnimatePresence>
        {showUpdateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setShowUpdateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
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

                    {/* InBody Upload */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-green-700" /> Upload New InBody / Body Composition Scan
                      </label>
                      <div
                        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={e => {
                          e.preventDefault();
                          setIsDragOver(false);
                          const f = e.dataTransfer.files[0];
                          if (f) setInbodyFile(f.name);
                        }}
                        className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                          isDragOver ? 'border-green-600 bg-green-50' : 'border-slate-200 hover:border-green-400 hover:bg-slate-50'
                        }`}
                      >
                        {inbodyFile ? (
                          <div className="flex items-center gap-3 justify-center">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <Check className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="text-sm font-medium text-slate-700">{inbodyFile}</span>
                            <button onClick={e => { e.stopPropagation(); setInbodyFile(null); }} className="text-slate-400 hover:text-red-500">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">Drag & drop or <label className="text-green-700 font-semibold cursor-pointer underline">
                              browse
                              <input type="file" className="hidden" accept=".pdf,.png,.jpg" onChange={e => {
                                if (e.target.files?.[0]) setInbodyFile(e.target.files[0].name);
                              }} />
                            </label></p>
                            <p className="text-xs text-slate-400 mt-1">PDF, PNG, JPG up to 10MB</p>
                          </>
                        )}
                      </div>
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
                      <stop offset="5%" stopColor="#166534" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#166534" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
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
            {activityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="steps" radius={[6, 6, 6, 6]}>
                    {activityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="font-medium">No activity data yet</p>
                  <p className="text-sm">Start tracking your daily steps</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Workouts', val: '0', change: '', color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Weight Lost', val: '0 kg', change: '', color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Avg. Protein', val: '0g', change: '', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Streak Days', val: '0', change: '', color: 'text-orange-500', bg: 'bg-orange-50' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ y: -4 }}
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