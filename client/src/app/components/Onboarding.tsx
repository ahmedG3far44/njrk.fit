import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, ArrowLeft, Check, Sparkles, User,
  Calendar, Ruler, Scale, Heart, Target, ChefHat, Activity
} from 'lucide-react';
import { useAuth, OnboardingData } from '../context/AuthProvider';
import { toast } from 'sonner';

interface OnboardingProps {
  onComplete: () => void;
}

const STEP_ICONS = [User, Heart, Activity, Target];
const STEP_LABELS = ['The Basics', 'Personalization', 'Health & Activity', 'Your Goal'];

const FOOD_PREFERENCES = [
  { category: 'Proteins', items: ['Chicken', 'Beef', 'Fish', 'Eggs', 'Tofu', 'Lentils', 'Beans'] },
  { category: 'Carbs', items: ['Rice', 'Bread', 'Potato', 'Pasta', 'Oats', 'Quinoa'] },
  { category: 'Fats', items: ['Avocado', 'Nuts', 'Cheese', 'Olive Oil'] },
  { category: 'Other', items: ['Dairy', 'Gluten', 'Seafood'] },
];

interface FormData {
  name: string;
  age: string;
  gender: string;
  height: string;
  weight: number;
  religion: string;
  foodPreferences: string[];
  allergies: string[];
  customAllergy: string;
  activityLevel: string;
  dreamGoal: string;
  targetWeight: number;
  goal: string;
  goalDate: string;
}

interface FormErrors {
  name?: string;
  age?: string;
  gender?: string;
  height?: string;
  weight?: string;
  religion?: string;
  foodPreferences?: string;
  activityLevel?: string;
  goal?: string;
  targetWeight?: string;
  dreamGoal?: string;
  goalDate?: string;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { completeOnboarding, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<FormData>({
    name: '',
    age: '',
    gender: '',
    height: '',
    weight: 0,
    religion: '',
    foodPreferences: [],
    allergies: [],
    customAllergy: '',
    activityLevel: '',
    dreamGoal: '',
    targetWeight: 0,
    goal: '',
    goalDate: '',
  });

  const update = (fields: Partial<FormData>) =>
    setFormData(prev => ({ ...prev, ...fields }));

  const toggleAllergy = (a: string) => {
    const next = formData.allergies.includes(a)
      ? formData.allergies.filter(x => x !== a)
      : [...formData.allergies, a];
    update({ allergies: next });
  };

  const toggleFoodPreference = (food: string) => {
    const next = formData.foodPreferences.includes(food)
      ? formData.foodPreferences.filter(x => x !== food)
      : [...formData.foodPreferences, food];
    update({ foodPreferences: next });
  };

  const clearError = (field: keyof FormErrors) => {
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: FormErrors = {};

    if (currentStep === 0) {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.age || Number(formData.age) < 13 || Number(formData.age) > 100) newErrors.age = 'Please enter a valid age (13-100)';
      if (!formData.gender) newErrors.gender = 'Please select your gender';
      if (!formData.height || Number(formData.height) < 100 || Number(formData.height) > 250) newErrors.height = 'Please enter a valid height (100-250 cm)';
      if (!formData.weight || formData.weight < 10 || formData.weight > 200) newErrors.weight = 'Please enter a valid weight (10-200 kg)';
    }

    if (currentStep === 1) {
      if (!formData.religion) newErrors.religion = 'Please select your religion';
    }

    if (currentStep === 2) {
      if (!formData.activityLevel) newErrors.activityLevel = 'Please select your activity level';
    }

    if (currentStep === 3) {
      if (!formData.goal) newErrors.goal = 'Please select your main goal';
      if (!formData.targetWeight) newErrors.targetWeight = 'Please enter your target weight';
      if (formData.goal === 'lose_weight' && formData.targetWeight >= formData.weight) {
        newErrors.targetWeight = 'Target weight must be less than current weight';
      }
      if (formData.goal === 'gain_weight' && formData.targetWeight <= formData.weight) {
        newErrors.targetWeight = 'Target weight must be greater than current weight';
      }
      if (formData.dreamGoal.length < 10) newErrors.dreamGoal = 'Please describe your goal in at least 10 characters';
      if (!formData.goalDate) newErrors.goalDate = 'Please set a target date for your goal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValid = () => {
    if (step === 0) return formData.name && formData.age && formData.gender && formData.height && formData.weight;
    if (step === 1) return formData.religion;
    if (step === 2) return formData.activityLevel;
    if (step === 3) return formData.goal && formData.targetWeight && formData.dreamGoal.length >= 10 && formData.goalDate;
    return true;
  };

  const mapActivityLevel = (level: string): OnboardingData['activityLevel'] => {
    const mapping: Record<string, { value: number; title: string; slug: OnboardingData['activityLevel']; emoji: string }> = {
      'Sedentary': { value: 1, title: 'Sedentary', slug: 'sedentary', emoji: '🪑' },
      'Lightly Active': { value: 2, title: 'Lightly Active', slug: 'light', emoji: '🚶' },
      'Moderately Active': { value: 3, title: 'Moderately Active', slug: 'moderate', emoji: '🔥' },
      'Very Active': { value: 4, title: 'Very Active', slug: 'active', emoji: '💪' },
      'Athlete': { value: 5, title: 'Athlete', slug: 'very_active', emoji: '🏆' },
    };
    return mapping[level]?.slug || 'sedentary';
  };

  const mapGoal = (goal: string): OnboardingData['userGoal'] => {
    const mapping: Record<string, OnboardingData['userGoal']> = {
      'lose_weight': 'lose_weight',
      'gain_muscle': 'gain_weight',
      'maintain_weight': 'maintain_weight',
    };
    return mapping[goal] || 'lose_weight';
  };

  const mapGender = (gender: string): OnboardingData['gender'] => {
    return gender.toLowerCase() as 'male' | 'female';
  };

  const mapReligion = (religion: string): OnboardingData['religion'] => {
    return religion.toLowerCase() as 'muslim' | 'christian';
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);

    const allergies = formData.customAllergy
      ? [...formData.allergies.filter(a => a !== 'None'), formData.customAllergy]
      : formData.allergies.filter(a => a !== 'None');

    const onboardingData: OnboardingData = {
      age: Number(formData.age),
      gender: mapGender(formData.gender),
      height: Number(formData.height),
      weight: formData.weight,
      allergies: allergies.length > 0 ? allergies : undefined,
      activityLevel: mapActivityLevel(formData.activityLevel) as "sedentary" | "light" | "moderate" | "active" | "very_active",
      religion: mapReligion(formData.religion),
      dietaryRestrictions: formData.foodPreferences.length > 0 ? formData.foodPreferences : undefined,
      userGoal: mapGoal(formData.goal),
      targetWeight: formData.targetWeight,
      fitnessGoal: formData.dreamGoal,
      goalDate: formData.goalDate,
    };

    console.log("onboarding data", onboardingData);

    try {
      await completeOnboarding(onboardingData);
      toast.success('Onboarding completed successfully!');
      onComplete();
    } catch (error: unknown) {
      const err = error as { status?: number; response?: { message?: string } };
      const message = err.response?.message || 'Failed to complete onboarding. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavigation = () => {
    if (!validateStep(step)) return;

    if (step === 3) {
      handleSubmit();
    } else {
      handleNext();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <User className="w-4 h-4 text-green-700" /> Username
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => { update({ name: e.target.value }); clearError('name'); }}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${errors.name ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-green-600'}`}
                placeholder="e.g. Alex Johnson"
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            </div>
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-700" /> Age
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={e => { update({ age: e.target.value }); clearError('age'); }}
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${errors.age ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-green-600'}`}
                  placeholder="25"
                  min={10} max={100}
                />
                {errors.age && <p className="text-red-500 text-xs">{errors.age}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Gender</label>
                <div className="flex gap-2">
                  {['Male', 'Female'].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => { update({ gender: g }); clearError('gender'); }}
                      className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${formData.gender === g
                        ? 'border-green-700 bg-green-50 text-green-800'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                {errors.gender && <p className="text-red-500 text-xs">{errors.gender}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-green-700" /> Height (cm)
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={e => { update({ height: e.target.value }); clearError('height'); }}
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${errors.height ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-green-600'}`}
                  placeholder="175"
                />
                {errors.height && <p className="text-red-500 text-xs">{errors.height}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-green-700" /> Weight (kg)
                </label>
                <input
                  type="number"
                  value={formData.weight || ''}
                  onChange={e => { update({ weight: Number(e.target.value) }); clearError('weight'); }}
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${errors.weight ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-green-600'}`}
                  placeholder="70"
                />
                {errors.weight && <p className="text-red-500 text-xs">{errors.weight}</p>}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Heart className="w-4 h-4 text-green-700" /> Religion / Fasting Periods
              </label>
              <p className="text-xs text-slate-400">Helps us respect your fasting calendars (Ramadan, Lent, etc.)</p>
              <div className="grid grid-cols-2 gap-3">
                {['Muslim', 'Christian'].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { update({ religion: r }); clearError('religion'); }}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all text-center ${formData.religion === r
                      ? 'border-green-600 bg-green-50 text-green-800'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {errors.religion && <p className="text-red-500 text-xs">{errors.religion}</p>}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-green-700" /> Food Preferences
                </label>
                <span className="text-xs text-slate-400">
                  {formData.foodPreferences.length} selected
                </span>
              </div>
              <p className="text-xs text-slate-400">Select the foods you want to include in your diet</p>

              {FOOD_PREFERENCES.map((category) => (
                <div key={category.category} className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{category.category}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {category.items.map((food) => (
                      <button
                        key={food}
                        type="button"
                        onClick={() => toggleFoodPreference(food)}
                        className={`p-2 rounded-lg border-2 text-xs font-semibold transition-all flex items-center justify-between gap-1 ${formData.foodPreferences.includes(food)
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                      >
                        <span>{food}</span>
                        {formData.foodPreferences.includes(food) && <Check className="w-3 h-3 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">Allergies & Intolerances</label>
              <div className="grid grid-cols-3 gap-2">
                {['Gluten', 'Dairy', 'Eggs', 'Peanuts', 'Tree Nuts', 'Shellfish', 'Soy', 'Fish', 'None'].map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAllergy(a)}
                    className={`p-2 rounded-lg border-2 text-xs font-semibold transition-all flex items-center justify-between gap-1 ${formData.allergies.includes(a)
                      ? 'border-red-400 bg-red-50 text-red-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                  >
                    <span>{a}</span>
                    {formData.allergies.includes(a) && <Check className="w-3 h-3 flex-shrink-0" />}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={formData.customAllergy}
                onChange={e => update({ customAllergy: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-600 outline-none transition-all text-sm"
                placeholder="Other allergy? Type here (e.g. Sesame, Mustard)..."
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-700" /> Activity Level
              </label>
              <div className="space-y-2">
                {[
                  { label: 'Sedentary', desc: 'Office job, little to no exercise', emoji: '🪑' },
                  { label: 'Lightly Active', desc: '1–3 days/week light exercise', emoji: '🚶' },
                  { label: 'Moderately Active', desc: '3–5 days/week moderate exercise', emoji: '🏃' },
                  { label: 'Very Active', desc: '6–7 days/week intense training', emoji: '💪' },
                  { label: 'Athlete', desc: 'Twice daily, professional level', emoji: '🏆' },
                ].map(level => (
                  <button
                    key={level.label}
                    type="button"
                    onClick={() => { update({ activityLevel: level.label }); clearError('activityLevel'); }}
                    className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${formData.activityLevel === level.label
                      ? 'border-green-700 bg-green-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                  >
                    <span className="text-2xl">{level.emoji}</span>
                    <div>
                      <div className={`font-semibold text-sm ${formData.activityLevel === level.label ? 'text-green-800' : 'text-slate-800'}`}>{level.label}</div>
                      <div className="text-xs text-slate-400">{level.desc}</div>
                    </div>
                    {formData.activityLevel === level.label && (
                      <div className="ml-auto w-5 h-5 bg-green-700 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {errors.activityLevel && <p className="text-red-500 text-xs">{errors.activityLevel}</p>}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className='grid grid-cols-2 gap-3'>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Select your goal</label>
                <select
                  onChange={(e) => { update({ goal: e.target.value }); clearError('goal'); }}
                  value={formData.goal}
                  className={`w-full px-4 py-4 rounded-xl border outline-none transition-all text-sm text-slate-700 ${errors.goal ? 'border-red-500' : 'border-slate-200 focus:ring-2 focus:ring-green-700'}`}
                >
                  <option value="">Select goal</option>
                  <option value="lose_weight">Lose Weight</option>
                  <option value="gain_muscle">Gain Muscle</option>
                  <option value="maintain_weight">Improve Health</option>
                </select>
                {errors.goal && <p className="text-red-500 text-xs">{errors.goal}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Target Weight (kg)</label>
                <input
                  onChange={(e) => { update({ targetWeight: Number(e.target.value) }); clearError('targetWeight'); }}
                  type="number"
                  value={formData.targetWeight || ''}
                  className={`w-full px-4 py-4 rounded-xl border outline-none transition-all text-sm text-slate-700 ${errors.targetWeight ? 'border-red-500' : 'border-slate-200 focus:ring-2 focus:ring-green-700'}`}
                  placeholder="Target weight"
                />
                {errors.targetWeight && <p className="text-red-500 text-xs">{errors.targetWeight}</p>}
              </div>
            </div>
            <div className="space-y-2 mt-5">
              <label htmlFor="dreamGoal" className="text-sm font-semibold text-slate-700">Describe Your Dream Body & Health Goal</label>
              <textarea
                value={formData.dreamGoal}
                onChange={(e) => { update({ dreamGoal: e.target.value }); clearError('dreamGoal'); }}
                className={`w-full px-4 py-4 rounded-xl border outline-none transition-all text-sm text-slate-700 leading-relaxed resize-none ${errors.dreamGoal ? 'border-red-500' : 'border-slate-200 focus:ring-2 focus:ring-green-700'}`}
                rows={6}
                placeholder="e.g. I want to lose 10kg in 3 months without feeling deprived..."
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>{formData.dreamGoal.length} characters</span>
                <span className={formData.dreamGoal.length >= 10 ? 'text-green-500' : ''}>
                  {formData.dreamGoal.length >= 10 ? '✓ Great detail!' : 'Minimum 10 characters'}
                </span>
              </div>
              {errors.dreamGoal && <p className="text-red-500 text-xs">{errors.dreamGoal}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-700" /> Target Date
              </label>
              <p className="text-xs text-slate-400">When do you want to achieve this goal?</p>
              <input
                type="date"
                value={formData.goalDate}
                onChange={(e) => { update({ goalDate: e.target.value }); clearError('goalDate'); }}
                min={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                className={`w-full px-4 py-4 rounded-xl border outline-none transition-all text-sm text-slate-700 ${errors.goalDate ? 'border-red-500' : 'border-slate-200 focus:ring-2 focus:ring-green-700'}`}
              />
              {errors.goalDate && <p className="text-red-500 text-xs">{errors.goalDate}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                'Lose weight without starving',
                'Build lean muscle at home',
                'Boost energy & reduce stress',
                "Improve my family's nutrition"
              ].map(suggestion => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => update({ dreamGoal: suggestion })}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-green-50 hover:border-green-300 hover:text-green-800 transition-all text-left font-medium"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          </div>
        );
    }
  };

  const isProcessing = isSubmitting || authLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="h-1.5 bg-slate-100">
          <motion.div
            className="h-full bg-gradient-to-r from-green-800 to-green-600"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / 4) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100">
          {STEP_ICONS.map((Icon, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${i < step ? 'bg-green-600 text-white' :
                i === step ? 'bg-gradient-to-br from-green-800 to-green-700 text-white shadow-lg shadow-green-200' :
                  'bg-slate-100 text-slate-400'
                }`}>
                {i < step ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] font-semibold hidden sm:block ${i === step ? 'text-green-700' : 'text-slate-400'}`}>
                {STEP_LABELS[i]}
              </span>
            </div>
          ))}
        </div>

        <div className="p-8 md:p-10">
          {/* Header */}
          <div className="mb-7">
            <div className="text-sm font-bold text-green-700 uppercase tracking-wider mb-2">
              Step {step + 1} of 4
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {[
                `Welcome! Let's get the basics.`,
                'Personalize your experience.',
                'Allergies & fitness level.',
                "What's your dream?"
              ][step]}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {[
                'We need this to calculate your precise caloric and nutritional needs.',
                'This helps our AI respect your lifestyle and cultural preferences.',
                'Used to generate safe meal plans and accurate caloric targets.',
                'Tell our AI about your ultimate health vision. Be as specific as possible.'
              ][step]}
            </p>
          </div>

          {/* Step Content */}
          <div className="min-h-[280px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0 || isProcessing}
              className="flex items-center gap-2 text-slate-500 font-semibold hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              type="button"
              onClick={handleNavigation}
              disabled={!isValid() || isProcessing}
              className="flex items-center gap-2 bg-gradient-to-r from-green-800 to-green-700 hover:from-green-900 hover:to-green-800 disabled:opacity-40 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-green-200"
            >
              {isProcessing ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
              ) : step === 3 ? (
                <>Complete Onboarding <Sparkles className="w-5 h-5" /></>
              ) : (
                <>Next <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};