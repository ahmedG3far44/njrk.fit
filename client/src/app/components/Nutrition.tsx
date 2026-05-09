import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Clock, Flame, Info, Utensils, Users, User, Search, X, Check, Sparkles, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RecipeDetail } from './RecipeDetail';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthProvider';
import { NutritionPlan, MealResponse, GenerateResponse, Meal } from '../services/nutritionService';
import type { FamilyMember, PendingInvitation, FamilyResponse, SearchResult } from '../services';

interface MealCardProps {
  meal: Meal;
  index: number;
  targetMacros: { calories: number; protein: number; carbs: number; fats: number };
  isFamilyMode: boolean;
  activeUserName: string;
  activeProfileId: string;
  canInteract: boolean;
  onViewRecipe: () => void;
  onSwap: () => void;
  swappingMeal: string | null;
}

const MealCard: React.FC<MealCardProps> = ({
  meal,
  index,
  targetMacros,
  isFamilyMode,
  activeUserName,
  activeProfileId,
  canInteract,
  onViewRecipe,
  onSwap,
  swappingMeal
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08 }}
    className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden mb-4"
  >
    <div className="p-5 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className="cursor-pointer" onClick={onViewRecipe}>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-green-700 transition-colors">
              {meal.name}
            </h3>
            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {meal.time || 'Any time'}
              </div>
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" /> {meal.macros?.calories || 0} kcal
              </div>
              {isFamilyMode && activeProfileId !== 'me' && (
                <div className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs font-bold">
                  <User className="w-3 h-3" /> {activeUserName}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { label: 'Protein', val: `${meal.macros?.protein || 0}g`, percent: targetMacros.protein ? Math.round((meal.macros?.protein || 0) / targetMacros.protein * 100) : 0 },
            { label: 'Carbs', val: `${meal.macros?.carbs || 0}g`, percent: targetMacros.carbs ? Math.round((meal.macros?.carbs || 0) / targetMacros.carbs * 100) : 0 },
            { label: 'Fats', val: `${meal.macros?.fats || 0}g`, percent: targetMacros.fats ? Math.round((meal.macros?.fats || 0) / targetMacros.fats * 100) : 0 },
          ].map((nut) => (
            <div key={nut.label} className="px-3 py-1 bg-slate-50 rounded-lg text-xs font-medium text-slate-600">
              {nut.label}: {nut.val} ({nut.percent}%)
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={onSwap}
          disabled={!canInteract || swappingMeal === meal._id}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors ${canInteract
            ? 'text-green-700 bg-green-50 hover:bg-green-100'
            : 'text-slate-400 bg-slate-100 cursor-not-allowed'
            } ${swappingMeal === meal._id ? 'opacity-60' : ''}`}
        >
          {swappingMeal === meal._id ? (
            <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Swapping...</>
          ) : (
            <><RefreshCw className="w-3.5 h-3.5" /> Swap Meal</>
          )}
        </button>
        <button
          onClick={onViewRecipe}
          disabled={!canInteract}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors ${canInteract
            ? 'text-slate-600 bg-slate-50 hover:bg-slate-100'
            : 'text-slate-400 bg-slate-100 cursor-not-allowed'
            }`}
        >
          <Utensils className="w-3.5 h-3.5" /> View Recipe
        </button>
      </div>
    </div>
  </motion.div>
);

export const Nutrition: React.FC = () => {
  const { user } = useAuth();
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isFamilyMode, setIsFamilyMode] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState<'me' | string>('me');
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingMeals, setIsLoadingMeals] = useState(false);

  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [currentMeals, setCurrentMeals] = useState<Meal[]>([]);
  const [targetMacros, setTargetMacros] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<Record<string, 'idle' | 'sending' | 'sent' | 'error'>>({});

  const [swappingMeal, setSwappingMeal] = useState<string | null>(null);

  const fetchMeals = useCallback(async (mode: 'today' | 'week', userId?: string) => {
    setIsLoadingMeals(true);
    try {
      const params = new URLSearchParams();
      params.append('date', mode);
      if (userId && userId !== 'me') {
        params.append('userId', userId);
      }

      const response = await api.get<MealResponse>(`/nutrition/current?${params.toString()}`);
      console.log(response);
      setCurrentMeals(response.meals);
      setTargetMacros(response.targetMacros);
    } catch (error) {
      console.error('Failed to fetch meals:', error);
    } finally {
      setIsLoadingMeals(false);
    }
  }, []);

  const generatePlan = async () => {
    setIsGenerating(true);
    try {
      const data = await api.post<GenerateResponse>('/nutrition/generate');
      setNutritionPlan(data.plan);
      toast.success('Meal plan generated successfully!');
      await fetchMeals(viewMode, activeProfileId !== 'me' ? activeProfileId : undefined);
    } catch (error) {
      toast.error('Failed to generate meal plan. Please try again.');
      console.error('Generate plan error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewModeChange = async (mode: 'today' | 'week') => {
    setViewMode(mode);
    await fetchMeals(mode, activeProfileId !== 'me' ? activeProfileId : undefined);
  };

  const handleProfileChange = async (profileId: 'me' | string, member?: FamilyMember) => {
    setActiveProfileId(profileId);
    setActiveUserId(profileId === 'me' ? (user?._id || null) : (member?._id || null));

    // Fetch meals for the selected profile
    const targetUserId = profileId !== 'me' ? profileId : undefined;
    await fetchMeals(viewMode, targetUserId);
  };

  // Check if viewing own profile
  const isOwnProfile = activeProfileId === 'me' || activeUserId === user?._id;

  const fetchFamily = async () => {
    try {
      const response = await api.get<FamilyResponse>('/family');
      setFamilyMembers(response.familyMembers);
      setPendingInvitations(response.pendingInvitations);
    } catch (error) {
      console.error('Failed to fetch family:', error);
    }
  };

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await api.get<{ results: SearchResult[] }>(`/family/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const sendInvite = async (targetUserId: string) => {
    setInviteStatus(prev => ({ ...prev, [targetUserId]: 'sending' }));
    try {
      await api.post('/family/invite', { targetUserId });
      setInviteStatus(prev => ({ ...prev, [targetUserId]: 'sent' }));
      toast.success('Invitation sent!');
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteStatus({});
        setSearchQuery('');
        setSearchResults([]);
      }, 2000);
    } catch (error) {
      setInviteStatus(prev => ({ ...prev, [targetUserId]: 'error' }));
      toast.error('Failed to send invitation. Please try again.');
    }
  };

  useEffect(() => {
    fetchMeals(viewMode, activeProfileId !== 'me' ? activeProfileId : undefined);
  }, [viewMode, fetchMeals, activeProfileId]);

  useEffect(() => {
    fetchFamily();
  }, []);

  // Auto-enable family mode when there are family members
  useEffect(() => {
    if (familyMembers.length > 0 && !isFamilyMode) {
      setIsFamilyMode(true);
    }
  }, [familyMembers]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, searchUsers]);

  const calculateMacros = () => {
    const totals = currentMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.macros?.calories || 0),
        protein: acc.protein + (meal.macros?.protein || 0),
        carbs: acc.carbs + (meal.macros?.carbs || 0),
        fats: acc.fats + (meal.macros?.fats || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
    return totals;
  };

  const totals = calculateMacros();


  const getCalories = (category: string, macro: number,) => {
    let total = 0;
    switch (category) {
      case 'calories':
        total += macro;
        return total;
      case 'protein':
        total += macro * 4;
        return total;
      case 'carbs':
        total += macro * 4;
        return total;
      case 'fats':
        total += macro * 9;
        return total;
      default:
        return total;
    }
  };

  const activeUser = activeProfileId === 'me'
    ? { id: 'me', name: 'You', avatarUrl: '' }
    : familyMembers.find(m => m._id === activeProfileId) || { id: 'me', name: 'You', avatarUrl: '' };

  return (
    <div className="space-y-6 relative">
      <AnimatePresence>
        {selectedMeal && (
          <RecipeDetail recipe={selectedMeal} onClose={() => setSelectedMeal(null)} />
        )}
      </AnimatePresence>

      {showInviteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setShowInviteModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Add Family Member</h3>
                <p className="text-slate-500 text-sm">Search by username or email</p>
              </div>
              <button onClick={() => { setShowInviteModal(false); setSearchQuery(''); setSearchResults([]); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                  placeholder="Search by username or email..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-600 outline-none text-sm transition-all"
                />
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {isSearching ? (
                  <div className="text-center py-8 text-slate-400">
                    <div className="w-6 h-6 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(user => (
                    <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 text-sm">{user.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{user.username}</div>
                      </div>
                      {inviteStatus[user.id] === 'sent' ? (
                        <div className="flex items-center gap-1 text-xs text-green-600 font-bold bg-green-50 px-3 py-1.5 rounded-xl">
                          <Check className="w-3 h-3" /> Sent!
                        </div>
                      ) : (
                        <button
                          onClick={() => sendInvite(user.id)}
                          disabled={inviteStatus[user.id] === 'sending'}
                          className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-xl font-semibold hover:bg-green-800 transition-colors disabled:opacity-50"
                        >
                          {inviteStatus[user.id] === 'sending' ? 'Sending...' : 'Invite'}
                        </button>
                      )}
                    </div>
                  ))
                ) : searchQuery.length >= 2 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No user found for "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Type at least 2 characters to search</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Nutrition Plan</h1>
            <p className="text-slate-500">AI-optimized meal plans for your goals.</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => { setIsFamilyMode(!isFamilyMode); setActiveProfileId('me'); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${isFamilyMode ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'}`}
            >
              {isFamilyMode ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
              {isFamilyMode ? 'Family Plan' : 'Solo Mode'}
            </button>


            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => handleViewModeChange('today')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'today' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                <Clock className="w-3.5 h-3.5" /> Today
              </button>
              <button
                onClick={() => handleViewModeChange('week')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                <CalendarDays className="w-3.5 h-3.5" /> Full Week
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 15px 35px -5px rgba(22,101,52,0.35)' }}
              whileTap={{ scale: 0.96 }}
              onClick={generatePlan}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-gradient-to-r from-green-800 to-green-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-green-200/50 disabled:opacity-50 relative overflow-hidden group"
            >
              {isGenerating ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <Sparkles className="w-4 h-4" />
                  Generate {viewMode === 'today' ? 'Today' : 'Full Week'}
                </>
              )}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {isFamilyMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 p-1 overflow-x-auto pb-2">
                <button
                  onClick={() => handleProfileChange('me')}
                  className={`flex items-center gap-3 pl-2 pr-5 py-2 rounded-full border transition-all min-w-[140px] ${activeProfileId === 'me'
                    ? 'border-green-600 bg-green-50 ring-2 ring-green-200'
                    : 'border-slate-200 hover:bg-slate-50 bg-white'
                    }`}
                >
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-green-700" />
                  </div>
                  <div className="text-left">
                    <div className={`font-bold text-sm ${activeProfileId === 'me' ? 'text-slate-900' : 'text-slate-600'}`}>You</div>
                    <div className="text-[10px] font-medium text-slate-400">{totals.calories} kcal</div>
                  </div>
                </button>

                {familyMembers.map(member => (
                  <button
                    key={member._id}
                    onClick={() => handleProfileChange(member._id, member)}
                    className={`flex items-center gap-3 pl-2 pr-5 py-2 rounded-full border transition-all min-w-[140px] ${activeProfileId === member._id
                      ? 'border-green-600 bg-green-50 ring-2 ring-green-200'
                      : 'border-slate-200 hover:bg-slate-50 bg-white'
                      }`}
                  >
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.name} className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                    <div className="text-left">
                      <div className={`font-bold text-sm ${activeProfileId === member._id ? 'text-slate-900' : 'text-slate-600'}`}>{member.name}</div>
                      <div className="text-[10px] font-medium text-slate-400">View plan</div>
                    </div>
                  </button>
                ))}

                {isFamilyMode && (
                  <div className="w-14 h-14 flex items-center justify-center rounded-full border transition-all duration-300 bg-white hover:bg-green-100 cursor-pointer">
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="flex items-center gap-2 p-2 text-sm font-semibold text-green-500 rounded-full transition-color cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>



      <motion.div
        key={activeProfileId}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Calories', current: totals.calories, target: targetMacros.calories, unit: 'kcal', color: 'bg-orange-500' },
          { label: 'Protein', current: totals.protein, target: targetMacros.protein, unit: 'g', color: 'bg-blue-500' },
          { label: 'Carbs', current: totals.carbs, target: targetMacros.carbs, unit: 'g', color: 'bg-green-600' },
          { label: 'Fats', current: totals.fats, target: targetMacros.fats, unit: 'g', color: 'bg-yellow-500' },
        ].map((macro) => {
          return (
            <div key={macro.label} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-slate-500 text-sm font-medium">{macro.label}</span>
                <Info className="w-4 h-4 text-slate-300" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-2">
                {macro.current}<span className="text-sm font-normal text-slate-400"> / {macro.unit}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${macro.color}`}
                />
              </div>
              <div className="text-xs text-slate-500 mt-1">{getCalories(macro.label.toLowerCase(), macro.current)} kcal</div>
            </div>
          );
        })}
      </motion.div>

      <div className="space-y-4">
        {isLoadingMeals ? (
          <div className="text-center py-12 text-slate-400">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-green-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="font-medium">Loading meals...</p>
          </div>
        ) : currentMeals.length > 0 ? (
          <>
            {viewMode === 'week' && (
              <>
                {(() => {
                  const mealsWithDay = currentMeals.filter(m => m.day);
                  const mealsWithoutDay = currentMeals.filter(m => !m.day);

                  return (
                    <>
                      {mealsWithDay.length > 0 && (
                        <div>
                          {mealsWithDay.reduce((acc, meal, index) => {
                            const currentDay = meal.day;
                            const lastDay = acc.length > 0 ? acc[acc.length - 1].day : null;

                            if (currentDay !== lastDay) {
                              acc.push({ day: currentDay, meals: [meal], startIndex: index });
                            } else if (acc.length > 0) {
                              acc[acc.length - 1].meals.push(meal);
                            }
                            return acc;
                          }, [] as { day: string | undefined; meals: Meal[]; startIndex: number }[]).map((dayGroup, dayIndex) => (
                            <div key={dayGroup.day || dayIndex}>
                              <div className="flex items-center gap-3 my-4">
                                <div className="h-px flex-1 bg-slate-200" />
                                <span className="text-sm font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full">
                                  {dayGroup.day || `Day ${dayIndex + 1}`}
                                </span>
                                <div className="h-px flex-1 bg-slate-200" />
                              </div>
                              {dayGroup.meals.map((meal, mealIndex) => (
                                <MealCard
                                  key={meal._id}
                                  meal={meal}
                                  index={dayGroup.startIndex + mealIndex}
                                  targetMacros={targetMacros}
                                  isFamilyMode={isFamilyMode}
                                  activeUserName={activeUser.name}
                                  activeProfileId={activeProfileId}
                                  canInteract={isOwnProfile}
                                  onViewRecipe={() => setSelectedMeal(meal)}
                                  onSwap={() => { setSwappingMeal(meal._id); setTimeout(() => setSwappingMeal(null), 1500); }}
                                  swappingMeal={swappingMeal}
                                />
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                      {mealsWithoutDay.length > 0 && (
                        <>
                          {mealsWithDay.length > 0 && (
                            <div className="flex items-center gap-3 my-4">
                              <div className="h-px flex-1 bg-slate-200" />
                              <span className="text-sm font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full">
                                Other Meals
                              </span>
                              <div className="h-px flex-1 bg-slate-200" />
                            </div>
                          )}
                          {mealsWithoutDay.map((meal, index) => (
                            <MealCard
                              key={meal._id}
                              meal={meal}
                              index={mealsWithDay.length + index}
                              targetMacros={targetMacros}
                              isFamilyMode={isFamilyMode}
                              activeUserName={activeUser.name}
                              activeProfileId={activeProfileId}
                              canInteract={isOwnProfile}
                              onViewRecipe={() => setSelectedMeal(meal)}
                              onSwap={() => { setSwappingMeal(meal._id); setTimeout(() => setSwappingMeal(null), 1500); }}
                              swappingMeal={swappingMeal}
                            />
                          ))}
                        </>
                      )}
                    </>
                  );
                })()}
              </>
            )}
            {viewMode === 'today' && currentMeals.map((meal, index) => (
              <MealCard
                key={meal._id}
                meal={meal}
                index={index}
                targetMacros={targetMacros}
                isFamilyMode={isFamilyMode}
                activeUserName={activeUser.name}
                activeProfileId={activeProfileId}
                canInteract={isOwnProfile}
                onViewRecipe={() => setSelectedMeal(meal)}
                onSwap={() => { setSwappingMeal(meal._id); setTimeout(() => setSwappingMeal(null), 1500); }}
                swappingMeal={swappingMeal}
              />
            ))}
          </>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <Utensils className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No meal plan yet</p>
            <p className="text-sm">Generate a meal plan to get started</p>
          </div>
        )}
      </div>

      <button className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-medium hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all flex items-center justify-center gap-2">
        <Plus className="w-5 h-5" />
        Log Extra Snack
      </button>
    </div>
  );
};


// interface MealRecipeProps {
//   meal: Meal;
//   onClose: () => void;
// }

// const MealRecipe = ({ meal, onClose }: MealRecipeProps) => {
//   return (
//     <div>
//       <h1>{meal.name}</h1>
//       <p>{meal.macros.calories}</p>
//       <p>{meal.macros.protein}</p>
//       <p>{meal.macros.carbs}</p>
//       <p>{meal.macros.fats}</p>
//       <p>{meal.time}</p>
//       {meal.ingredients?.map((ingredient) => (
//         <p key={ingredient}>{ingredient}</p>
//       ))}
//       {meal.instructions?.map((instruction) => (
//         <p key={instruction}>{instruction}</p>
//       ))}
//       <button onClick={onClose}>Close</button>
//     </div>
//   );
// }