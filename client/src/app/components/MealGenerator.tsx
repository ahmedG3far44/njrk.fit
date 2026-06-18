import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Wand2, RefreshCw, ChefHat, Filter } from 'lucide-react';
import { Button } from './ui/button';

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
        className="bg-card rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-forest-canopy/10">
          <div>
            <h2 className="text-2xl font-bold text-card-foreground flex items-center gap-2">
              <Wand2 className="w-6 h-6 text-forest-canopy" /> AI Meal Planner
            </h2>
            <p className="text-muted-foreground text-sm">Generate a personalized plan in seconds.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full text-muted-foreground">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto">
          {!generated && !generating && (
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="block text-sm font-bold text-card-foreground">Dietary Preference</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Balanced', 'Keto', 'Vegan', 'Paleo'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setPreferences({...preferences, diet: d})}
                      className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                        preferences.diet === d 
                          ? 'border-forest-canopy/50 bg-forest-canopy/10 text-forest-canopy shadow-sm' 
                          : 'border-border hover:border-foreground/20 text-muted-foreground'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <label className="block text-sm font-bold text-card-foreground">Daily Calories</label>
                  <span className="text-forest-canopy font-bold">{preferences.calories} kcal</span>
                </div>
                <input 
                  type="range" 
                  min="1200" 
                  max="4000" 
                  step="100"
                  value={preferences.calories}
                  onChange={(e) => setPreferences({...preferences, calories: Number(e.target.value)})}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[var(--forest-canopy)]"
                />
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleGenerate}
                className="w-full justify-center gap-2"
              >
                <Wand2 className="w-5 h-5" /> Generate Plan
              </Button>
            </div>
          )}

          {generating && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-forest-deep border-t-forest-canopy rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ChefHat className="w-8 h-8 text-forest-canopy" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-card-foreground">Crafting your menu...</h3>
                <p className="text-muted-foreground">Analyzing macros and ingredients</p>
              </div>
            </div>
          )}

          {generated && (
            <div className="space-y-6">
              <div className="bg-forest-canopy/10 text-forest-canopy p-4 rounded-xl flex items-center gap-3 mb-6">
                <div className="bg-forest-canopy/20 p-2 rounded-full">
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
                  <div key={i} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm">
                    <div>
                      <div className="text-xs font-bold text-forest-canopy uppercase mb-1">{meal.type}</div>
                      <div className="font-bold text-card-foreground">{meal.name}</div>
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">{meal.cal} kcal</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={onClose}
                >
                  Accept Plan
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setGenerated(false)}
                >
                  Try Again
                </Button>
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