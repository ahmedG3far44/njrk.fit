import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Wand2, RefreshCw, ChefHat, Filter } from 'lucide-react';

interface MealGeneratorProps {
  onClose: () => void;
}

export const MealGenerator: React.FC<MealGeneratorProps> = ({ onClose }) => {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  
  const [preferences, setPreferences] = useState({
    calories: 2000,
    diet: 'Balanced',
    meals: 3,
  });

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-green-50/50">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Wand2 className="w-6 h-6 text-green-700" /> AI Meal Planner
            </h2>
            <p className="text-slate-500 text-sm">Generate a personalized plan in seconds.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto">
          {!generated && !generating && (
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700">Dietary Preference</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Balanced', 'Keto', 'Vegan', 'Paleo'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setPreferences({...preferences, diet: d})}
                      className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                        preferences.diet === d 
                          ? 'border-green-700 bg-green-50 text-green-800' 
                          : 'border-slate-100 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <label className="block text-sm font-bold text-slate-700">Daily Calories</label>
                  <span className="text-green-700 font-bold">{preferences.calories} kcal</span>
                </div>
                <input 
                  type="range" 
                  min="1200" 
                  max="4000" 
                  step="100"
                  value={preferences.calories}
                  onChange={(e) => setPreferences({...preferences, calories: Number(e.target.value)})}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-700"
                />
              </div>

              <button 
                onClick={handleGenerate}
                className="w-full py-4 bg-gradient-to-r from-green-800 to-green-700 text-white rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2"
              >
                <Wand2 className="w-5 h-5" /> Generate Plan
              </button>
            </div>
          )}

          {generating && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-green-100 border-t-green-700 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ChefHat className="w-8 h-8 text-green-700" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Crafting your menu...</h3>
                <p className="text-slate-500">Analyzing macros and ingredients</p>
              </div>
            </div>
          )}

          {generated && (
            <div className="space-y-6">
              <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3 mb-6">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckHat className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold">Plan Ready!</div>
                  <div className="text-sm">Optimized for {preferences.diet} • {preferences.calories} kcal</div>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { type: 'Breakfast', name: 'Spinach & Feta Omelette', cal: 450 },
                  { type: 'Lunch', name: 'Quinoa Power Bowl', cal: 650 },
                  { type: 'Dinner', name: 'Lemon Herb Salmon', cal: 550 },
                  { type: 'Snack', name: 'Greek Yogurt & Berries', cal: 200 },
                ].map((meal, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <div>
                      <div className="text-xs font-bold text-green-700 uppercase mb-1">{meal.type}</div>
                      <div className="font-bold text-slate-900">{meal.name}</div>
                    </div>
                    <div className="text-sm text-slate-500 font-medium">{meal.cal} kcal</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <button 
                  onClick={onClose}
                  className="py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800"
                >
                  Accept Plan
                </button>
                <button 
                  onClick={() => setGenerated(false)}
                  className="py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Helper component for the icon (Typo fix in main code logic)
const CheckHat = (props: any) => <ChefHat {...props} />;