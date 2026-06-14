import React, { useState, useEffect } from 'react';
import { X, Clock, Flame, ChefHat, PlayCircle, Heart, RefreshCw, Sparkles, Send } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { MealItem, nutritionService } from '../services/nutritionService';
import { toast } from 'sonner';


interface RecipeDetailProps {
  onClose: () => void;
  canRefine?: boolean;
  onMealRefined?: (meal: any) => void;
  onReplaced?: (meal: any) => void;
  replacementsLeft?: number;
  recipe?: {
    _id: string;
    name?: string;
    image?: string;
    calories?: number;
    protein?: string;
    carbs?: string;
    fat?: string;
    time?: string;
    ingredients?: MealItem[];
    steps?: string[];
    macros?: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      fats?: number;
    };
    instructions?: string[];
  };
}
const getDynamicMealImage = (mealName: string = '') => {
  const name = mealName.toLowerCase();
  
  if (name.includes('chicken') || name.includes('turkey') || name.includes('poultry')) {
    return 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=800';
  }
  if (name.includes('salmon') || name.includes('fish') || name.includes('tuna') || name.includes('seafood') || name.includes('shrimp')) {
    return 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=800';
  }
  if (name.includes('salad') || name.includes('greens') || name.includes('spinach') || name.includes('avocado')) {
    return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800';
  }
  if (name.includes('smoothie') || name.includes('shake') || name.includes('juice') || name.includes('drink')) {
    return 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=800';
  }
  if (name.includes('egg') || name.includes('eggs') || name.includes('omelet') || name.includes('scramble') || name.includes('benedict')) {
    return 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=800';
  }
  if (name.includes('oat') || name.includes('oatmeal') || name.includes('chia') || name.includes('yogurt') || name.includes('berry') || name.includes('berries')) {
    return 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=800';
  }
  if (name.includes('beef') || name.includes('steak') || name.includes('meat') || name.includes('pork') || name.includes('lamb') || name.includes('burger') || name.includes('ribs')) {
    return 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800';
  }
  if (name.includes('soup') || name.includes('stew') || name.includes('broth') || name.includes('ramen') || name.includes('lentil')) {
    return 'https://images.unsplash.com/photo-1547592165-e1d17fed6006?auto=format&fit=crop&q=80&w=800';
  }
  if (name.includes('pancake') || name.includes('waffle') || name.includes('toast') || name.includes('bread') || name.includes('sandwich')) {
    return 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&q=80&w=800';
  }
  if (name.includes('snack') || name.includes('nut') || name.includes('almond') || name.includes('bar') || name.includes('fruit') || name.includes('apple')) {
    return 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=800';
  }

  // Fallback stable hash function selection
  const fallbacks = [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&q=80&w=800'
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % fallbacks.length;
  return fallbacks[index];
};

export const RecipeDetail: React.FC<RecipeDetailProps> = ({ onClose, onMealRefined, onReplaced, recipe, canRefine = true, replacementsLeft = 3 }) => {
  const [aiInstruction, setAiInstruction] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerated, setRegenerated] = useState(false);
  const [liked, setLiked] = useState(false);

  const [currentRecipe, setCurrentRecipe] = useState<RecipeDetailProps["recipe"]>(recipe);

  useEffect(() => {
    setCurrentRecipe(recipe);
  }, [recipe]);

  const defaultRecipe = {
    name: 'Grilled Chicken Quinoa Bowl',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
    calories: 650,
    protein: '45g',
    carbs: '55g',
    fat: '20g',
    time: '25 min',
    ingredients: [
      '200g Chicken Breast',
      '1 cup Quinoa (cooked)',
      '1/2 Avocado',
      '1 cup Spinach',
      '10 Cherry Tomatoes',
      '1 tbsp Olive Oil',
      'Lemon Juice',
      'Salt & Pepper'
    ],
    steps: [
      'Season chicken breast with salt, pepper, and lemon juice.',
      'Grill chicken for 6-8 minutes per side until cooked through.',
      'While chicken cooks, chop tomatoes and avocado.',
      'Assemble the bowl: Start with quinoa base, add spinach.',
      'Slice chicken and place on top.',
      'Add veggies and drizzle with olive oil.',
      'Serve immediately.'
    ]
  };

  const getCalories = () =>
    currentRecipe?.calories ??
    (currentRecipe?.macros?.calories != null
      ? currentRecipe.macros.calories
      : defaultRecipe.calories);

  const getProtein = () =>
    currentRecipe?.protein ??
    (currentRecipe?.macros?.protein != null
      ? `${currentRecipe.macros.protein}g`
      : defaultRecipe.protein);
  const getCarbs = () =>
    currentRecipe?.carbs ??
    (currentRecipe?.macros?.carbs != null
      ? `${currentRecipe.macros.carbs}g`
      : defaultRecipe.carbs);
  const getFat = () =>
    currentRecipe?.fat ??
    (currentRecipe?.macros?.fats != null
      ? `${currentRecipe.macros.fats}g`
      : currentRecipe?.macros?.fat != null
        ? `${currentRecipe.macros.fat}g`
        : defaultRecipe.fat);

  const getIngredients = () => {
    const ingredients = currentRecipe?.ingredients?.length ? currentRecipe.ingredients : defaultRecipe.ingredients;
    return ingredients.map((ing: string | { name: string; _id?: string }) =>
      typeof ing === 'string' ? ing : ing?.name || ''
    ).filter(Boolean);
  };

  const getSteps = () => {
    const steps = currentRecipe?.steps?.length
      ? currentRecipe.steps
      : currentRecipe?.instructions?.length
        ? currentRecipe.instructions
        : defaultRecipe.steps;
    return steps.map((step: string | { name: string; _id?: string }) =>
      typeof step === 'string' ? step : step?.name || ''
    ).filter(Boolean);
  };

  const data = {
    ...defaultRecipe,
    ...currentRecipe,
    calories: getCalories(),
    protein: getProtein(),
    carbs: getCarbs(),
    fat: getFat(),
    ingredients: currentRecipe?.ingredients,
    steps: getSteps(),
    image: currentRecipe?.image || getDynamicMealImage(currentRecipe?.name || recipe?.name || defaultRecipe.name),
  };

  const handleRefine = async () => {
    if (replacementsLeft <= 0) {
      toast.error('No replacements or refinements left today!');
      return;
    }
    if (!aiInstruction.trim()) return;
    setIsRegenerating(true);
    try {
      const mealId = currentRecipe?._id as string;
      const response = await nutritionService.refine(mealId, { refinement: aiInstruction });
      setCurrentRecipe(response.meal);
      onMealRefined?.(response.meal);
      setAiInstruction('');
      toast.success('Recipe refined successfully!');
    } catch (error) {
      console.error('Failed to refine recipe:', error);
      toast.error('Failed to refine recipe. Please try again.');
    } finally {
      setRegenerated(true);
      setIsRegenerating(false);
    }
  };

  const handleReplace = async () => {
    if (replacementsLeft <= 0) return;
    setIsRegenerating(true);
    try {
      const mealId = currentRecipe?._id as string;
      const response = await nutritionService.replace(mealId);
      setCurrentRecipe(response.meal);
      onReplaced?.(response.meal);
      toast.success('Recipe regenerated successfully!');
    } catch (error) {
      console.error('Failed to regenerate recipe:', error);
      toast.error('Failed to regenerate recipe. Please try again.');
    } finally {
      setRegenerated(true);
      setIsRegenerating(false);
    }
  };

  const suggestions = [
    'Make it under 15 mins',
    'I don\'t have eggs today',
    'Make it dairy-free',
    'Higher protein version',
    'I prefer spicy food',
  ];

  return (
    <div className="fixed z-50 w-full min-h-screen left-0 top-0 flex items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full h-screen sm:h-auto lg:w-3/4 overflow-hidden shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute md:top-4 md:right-4 top-2 right-2 z-20 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors backdrop-blur-md"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Image Side */}
          <div className="md:w-1/2 relative h-[400px] md:h-auto min-h-[300px]">
            <AnimatePresence mode="wait">
              {isRegenerating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-br from-green-900 to-green-700 flex flex-col items-center justify-center text-white"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full mb-6"
                  />
                  <Sparkles className="w-8 h-8 text-yellow-300 mb-3" />
                  <p className="font-bold text-xl">Regenerating...</p>
                  <p className="text-green-200 text-sm mt-2 text-center px-8">
                    AI is crafting your customized meal
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="image"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0"
                >
                  <img
                    src={data.image}
                    alt={data.name}
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800';
                    }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8 text-white">
                    {regenerated && (
                      <div className="inline-flex items-center gap-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 w-fit">
                        <Sparkles className="w-3 h-3" /> AI Regenerated
                      </div>
                    )}
                    <div className="inline-block px-3 py-1 bg-green-500 rounded-lg text-xs font-bold mb-4 w-fit">
                      HEALTHY CHOICE
                    </div>
                    <h2 className="text-3xl font-bold mb-4">{data.name}</h2>
                    <div className="flex gap-6 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" /> {data.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-400" /> {data.calories} kcal
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Content Side */}
          <div className="md:w-1/2 overflow-y-auto bg-white max-h-[90vh]">
            <div className="p-8">
              {/* Macros */}
              <div className="flex gap-3 mb-6">
                {[
                  { label: 'Protein', val: data.protein, color: 'bg-blue-50 text-blue-700' },
                  { label: 'Carbs', val: data.carbs, color: 'bg-green-50 text-green-700' },
                  { label: 'Fat', val: data.fat, color: 'bg-orange-50 text-orange-700' },
                ].map((nut) => (
                  <div key={nut.label} className={`flex-1 p-3 rounded-xl text-center ${nut.color}`}>
                    <div className="font-bold text-lg">{nut.val}</div>
                    <div className="text-xs opacity-80">{nut.label}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                {/* Ingredients */}
                <div>
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-green-700" /> Ingredients
                  </h3>
                  <ul className="grid grid-cols-2 gap-2">
                    {data?.ingredients?.map((ing: MealItem, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-slate-600 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                        {ing?.quantity && ing?.unit ? `${ing.name} (${ing.quantity}${ing.unit})` : ing.name}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-green-700" /> Instructions
                  </h3>
                  <div className="space-y-3">
                    {data.steps.map((step: string, i: number) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-green-50 text-green-700 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                          {i + 1}
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed mt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {canRefine && (
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-green-600" /> Refine with AI
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">Give the AI specific instructions to regenerate this meal</p>

                  {/* Quick Suggestions */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {suggestions.map(s => (
                      <button
                        key={s}
                        onClick={() => setAiInstruction(s)}
                        disabled={replacementsLeft <= 0}
                        className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-slate-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all font-medium disabled:opacity-50 disabled:hover:bg-slate-50 disabled:hover:text-slate-600 disabled:hover:border-slate-200 disabled:cursor-not-allowed"
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiInstruction}
                      onChange={e => setAiInstruction(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRefine()}
                      disabled={replacementsLeft <= 0 || isRegenerating}
                      placeholder={replacementsLeft <= 0 ? 'No refinements left today' : 'e.g. Make it vegan and under 400 calories...'}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-600 outline-none text-sm transition-all disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed"
                    />
                    <button
                      onClick={handleRefine}
                      disabled={!aiInstruction.trim() || isRegenerating || replacementsLeft <= 0}
                      className="bg-gradient-to-r from-green-800 to-green-700 text-white p-3 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-400">
                      Replacements / Refinements left: <strong>{replacementsLeft}</strong>/3
                    </span>
                  </div>

                  <button
                    onClick={handleReplace}
                    disabled={replacementsLeft <= 0 || isRegenerating}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-green-400 text-green-700 rounded-xl font-semibold hover:bg-green-50 transition-all disabled:opacity-50 text-sm cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                    {replacementsLeft <= 0 ? 'No Tries Left' : 'Regenerate this Meal (AI Surprise)'}
                  </button>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};