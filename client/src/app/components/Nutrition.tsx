import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Minus,
  Clock,
  Flame,
  Info,
  Utensils,
  Users,
  User,
  Search,
  X,
  Check,
  Sparkles,
  CalendarDays,
  FileDown,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RecipeDetail } from "./RecipeDetail";
import { api } from "../lib/api";
import { toast } from "sonner";
import { useAuth } from "../context/AuthProvider";
import {
  NutritionPlan,
  MealResponse,
  GenerateResponse,
  Meal,
} from "../services/nutritionService";
import {
  type FamilyMember,
  type PendingInvitation,
  type FamilyResponse,
  type SearchResult,
  familyService,
} from "../services";
import { MealPlanLoader } from "./GeneratingLoaders";

const API_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8080/api";

interface MealCardProps {
  meal: Meal;
  index: number;
  targetMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  isFamilyMode: boolean;
  activeUser: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  activeProfileId: string;
  canInteract: boolean;
  onViewRecipe: () => void;
}

const MealCard: React.FC<MealCardProps> = ({
  meal,
  index,
  targetMacros,
  isFamilyMode,
  activeUser,
  activeProfileId,
  canInteract,
  onViewRecipe,
}) => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.06,
        duration: 0.25,
        ease: [0.23, 1, 0.32, 1],
      }}
      className="group bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden mb-4"
    >
      <div className="p-5 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <div className="cursor-pointer" onClick={onViewRecipe}>
              <h3 className="text-lg font-bold text-card-foreground group-hover:text-green-400 transition-colors">
                {meal.name}
              </h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {meal.time || t("nutrition.anyTime")}
                </div>
                {meal.mealType === "snack" && (
                  <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-xs font-bold">
                    {t("nutrition.snack")}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Flame className="w-4 h-4 text-orange-500" />{" "}
                  {meal.macros?.calories || 0} {t("nutrition.kcal")}
                </div>
                {isFamilyMode && activeProfileId !== "me" && (
                  <div className="flex items-center gap-1 text-green-400 bg-green-500/10 px-2 py-0.5 rounded text-xs font-bold">
                    <img
                      src={activeUser.avatarUrl}
                      alt={activeUser.name}
                      className="w-4 h-4 rounded-full"
                    />
                    {activeUser.name}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {[
              {
                label: t('nutrition.protein'),
                val: `${meal.macros?.protein || 0}g`,
                percent: targetMacros.protein
                  ? Math.round(
                      ((meal.macros?.protein || 0) / targetMacros.protein) * 100,
                    )
                  : 0,
              },
              {
                label: t('nutrition.carbs'),
                val: `${meal.macros?.carbs || 0}g`,
                percent: targetMacros.carbs
                  ? Math.round(
                      ((meal.macros?.carbs || 0) / targetMacros.carbs) * 100,
                    )
                  : 0,
              },
              {
                label: t('nutrition.fats'),
                val: `${meal.macros?.fats || 0}g`,
                percent: targetMacros.fats
                  ? Math.round(
                      ((meal.macros?.fats || 0) / targetMacros.fats) * 100,
                    )
                  : 0,
              },
            ].map((nut) => (
              <div
                key={nut.label}
                className="px-3 py-1 bg-muted rounded-lg text-xs font-medium text-muted-foreground"
              >
                {nut.label}: {nut.val} ({nut.percent}%)
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={onViewRecipe}
            disabled={!canInteract}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors ${
              canInteract
                ? "text-muted-foreground bg-muted hover:bg-muted"
                : "text-muted-foreground bg-muted cursor-not-allowed"
            }`}
          >
            <Utensils className="w-3.5 h-3.5" /> {t("nutrition.viewRecipe")}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const Nutrition: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isFamilyMode, setIsFamilyMode] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState<"me" | string>("me");
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"today" | "week">("today");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingMeals, setIsLoadingMeals] = useState(false);

  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(
    null,
  );
  const [currentMeals, setCurrentMeals] = useState<Meal[]>([]);
  const [targetMacros, setTargetMacros] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });
  const [planDate, setPlanDate] = useState<string | null>(null);

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<
    PendingInvitation[]
  >([]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<
    Record<string, "idle" | "sending" | "sent" | "error">
  >({});

  const [replacementsLeft, setReplacementsLeft] = useState<number>(() => {
    const stored = localStorage.getItem(`replacements_left_${user?._id}`);
    return stored !== null ? parseInt(stored, 10) : 3;
  });

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [mealsCount, setMealsCount] = useState(3);
  const [snacksCount, setSnacksCount] = useState(0);
  const [favoriteFoods, setFavoriteFoods] = useState<string[]>([]);
  const [foodInput, setFoodInput] = useState("");
  const [repeatMeals, setRepeatMeals] = useState(false);

  useEffect(() => {
    if (user?.preferences?.repeatMealsEveryDay !== undefined) {
      setRepeatMeals(user.preferences.repeatMealsEveryDay);
    }
  }, [user]);

  const fetchMeals = useCallback(
    async (mode: "today" | "week", userId?: string) => {
      setIsLoadingMeals(true);
      try {
        const params = new URLSearchParams();
        params.append("date", mode);
        if (userId && userId !== "me") {
          params.append("userId", userId);
        }

        const response = await api.get<MealResponse>(
          `/nutrition/current?${params.toString()}`,
        );
        console.log(response);
        setCurrentMeals(response.meals);
        setTargetMacros(response.targetMacros);
        setPlanDate(response.planDate || null);
      } catch (error) {
        console.error(
          `[${(error as Error)?.name}] - Failed to fetch meals: ${(error as Error).message}`,
        );
      } finally {
        setIsLoadingMeals(false);
      }
    },
    [],
  );
  const fetchFamilyMemberMeals = useCallback(async (memberId?: string) => {
    setIsLoadingMeals(true);
    try {
      if (!memberId) return;

      const response = await familyService.getFamilyMemberNutritionPlan(
        memberId as string,
      );
      console.log("memebr meals of user:", memberId);
      console.log(response);

      setCurrentMeals(response.meals);
      setTargetMacros(response.targetMacros);
    } catch (error) {
      console.error("Failed to fetch meals:", error);
    } finally {
      setIsLoadingMeals(false);
    }
  }, []);

  const generatePlan = async (counts?: {
    mealsCount: number;
    snacksCount: number;
    favoriteFoods: string[];
    repeatMeals?: boolean;
  }) => {
    if (currentMeals.length > 0 && replacementsLeft <= 0) {
      toast.error(t("nutrition.replacementsLeft"));
      return;
    }
    setIsGenerating(true);
    try {
      const data = await api.post<GenerateResponse>(
        "/nutrition/generate",
        counts || {},
      );
      setNutritionPlan(data.plan);
      setCurrentMeals(data.plan.meals || []);
      setTargetMacros(data.plan.targetMacros);
      setPlanDate(data.plan.date || null);
      toast.success(t("nutrition.mealPlanGenerated"));
      if (currentMeals.length > 0) {
        const updated = replacementsLeft - 1;
        setReplacementsLeft(updated);
        localStorage.setItem(`replacements_left_${user?._id}`, String(updated));
      }
      fetchMeals(
        viewMode,
        activeProfileId !== "me" ? activeProfileId : undefined,
      );
    } catch (error) {
      toast.error(t("nutrition.generateFailed"));
      console.error("Generate plan error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateWithConfig = () => {
    setShowGenerateModal(false);
    generatePlan({ mealsCount, snacksCount, favoriteFoods, repeatMeals });
    setMealsCount(3);
    setSnacksCount(0);
    setFavoriteFoods([]);
    setFoodInput("");
  };

  const removeFavoriteFood = (food: string) => {
    setFavoriteFoods((prev) => prev.filter((f) => f !== food));
  };

  const handleFoodKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && foodInput.trim()) {
      e.preventDefault();
      const food = foodInput.trim().replace(/,/g, "");
      if (!favoriteFoods.includes(food)) {
        setFavoriteFoods((prev) => [...prev, food]);
      }
      setFoodInput("");
    }
  };

  const handleViewModeChange = async (mode: "today" | "week") => {
    setViewMode(mode);
    await fetchMeals(
      mode,
      activeProfileId !== "me" ? activeProfileId : undefined,
    );
  };

  const handleProfileChange = async (
    profileId: "me" | string,
    member?: FamilyMember,
  ) => {
    console.log("profileId", profileId);
    console.log("member", member);
    console.log("activeProfileId", activeProfileId);
    console.log("activeUserId", activeUserId);

    setActiveProfileId(profileId);
    setActiveUserId(
      profileId === "me" ? user?._id || null : member?.id || null,
    );

    if (profileId === "me") {
      await fetchMeals(viewMode, undefined);
    } else {
      await fetchFamilyMemberMeals(member?.id);
    }
  };

  // Check if viewing own profile
  const isOwnProfile = activeProfileId === "me" || activeUserId === user?._id;

  const fetchFamily = async () => {
    try {
      const response = await api.get<FamilyResponse>("/family");
      setFamilyMembers(response.familyMembers);
      setPendingInvitations(response.pendingInvitations);
    } catch (error) {
      console.error("Failed to fetch family:", error);
    }
  };

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await api.get<{ results: SearchResult[] }>(
        `/family/search?q=${encodeURIComponent(query)}`,
      );
      setSearchResults(response.results);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const sendInvite = async (targetUserId: string) => {
    setInviteStatus((prev) => ({ ...prev, [targetUserId]: "sending" }));
    try {
      await api.post("/family/invite", { targetUserId });
      setInviteStatus((prev) => ({ ...prev, [targetUserId]: "sent" }));
      toast.success(t("nutrition.invitationSent"));
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteStatus({});
        setSearchQuery("");
        setSearchResults([]);
      }, 2000);
    } catch (error) {
      setInviteStatus((prev) => ({ ...prev, [targetUserId]: "error" }));
      toast.error(t("nutrition.sendFailed"));
    }
  };

  useEffect(() => {
    // Only fetch on initial load or when viewMode or family mode changes
    // Profile switching is handled in handleProfileChange
    const userId = activeProfileId !== "me" ? activeProfileId : undefined;
    activeProfileId === "me"
      ? fetchMeals(viewMode, userId)
      : fetchFamilyMemberMeals(activeProfileId as string);
  }, [viewMode, isFamilyMode]);

  useEffect(() => {
    fetchFamily();
  }, []);

  // Auto-enable family mode when there are family members
  useEffect(() => {
    if (
      user?.preferences?.familyPlan &&
      familyMembers.length > 0 &&
      !isFamilyMode
    ) {
      setIsFamilyMode(true);
    }
  }, [familyMembers, isFamilyMode, user?.preferences?.familyPlan]);

  // Turn off family mode if Family Plan Management is disabled in preferences
  useEffect(() => {
    if (user && !user.preferences?.familyPlan) {
      setIsFamilyMode(false);
      setActiveProfileId("me");
    }
  }, [user?.preferences?.familyPlan, user]);

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
      { calories: 0, protein: 0, carbs: 0, fats: 0 },
    );
    return totals;
  };

  const generationLock = (() => {
    if (!planDate) return { canGenerate: true, message: null as string | null };
    const unlockDate = new Date(planDate);
    unlockDate.setDate(unlockDate.getDate() + 7);
    if (new Date() >= unlockDate) return { canGenerate: true, message: null };
    return {
      canGenerate: false,
      message: t("nutrition.generationLocked") + ` ${unlockDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    };
  })();

  const totals = calculateMacros();

  const getCalories = (category: string, macro: number) => {
    let total = 0;
    switch (category) {
      case "calories":
        total += macro;
        return total;
      case "protein":
        total += macro * 4;
        return total;
      case "carbs":
        total += macro * 4;
        return total;
      case "fats":
        total += macro * 9;
        return total;
      default:
        return total;
    }
  };

  const foundMember = familyMembers.find((m) => m.id === activeProfileId);
  const activeUser =
    activeProfileId === "me"
      ? { id: "me", name: t('nutrition.you'), avatarUrl: "" }
      : {
          id: foundMember?.id || "me",
          name: foundMember?.name || t('nutrition.you'),
          avatarUrl: foundMember?.avatarUrl || "",
        };

  const isNoPlan =
    currentMeals.length === 0 && !isLoadingMeals && !isGenerating;

  return (
    <div className="space-y-6 relative">
      <AnimatePresence>
        {selectedMeal && (
          <RecipeDetail
            recipe={selectedMeal}
            onClose={() => setSelectedMeal(null)}
            canRefine={isOwnProfile}
            replacementsLeft={replacementsLeft}
            onMealRefined={(refinedMeal) => {
              const updated = replacementsLeft - 1;
              setReplacementsLeft(updated);
              localStorage.setItem(
                `replacements_left_${user?._id}`,
                String(updated),
              );

              const originalMeal = selectedMeal;
              setSelectedMeal(refinedMeal);
              const isRepeat = !!user?.preferences?.repeatMealsEveryDay;
              if (isRepeat && originalMeal) {
                setCurrentMeals((prev) =>
                  prev.map((m) => {
                    const isSameMeal =
                      m._id === refinedMeal._id ||
                      (m.time === originalMeal.time &&
                        m.mealType === originalMeal.mealType) ||
                      m.name === originalMeal.name;
                    if (isSameMeal) {
                      return {
                        ...refinedMeal,
                        _id: m._id,
                        day: m.day,
                      };
                    }
                    return m;
                  }),
                );
              } else {
                setCurrentMeals((prev) =>
                  prev.map((m) =>
                    m._id === refinedMeal._id ? refinedMeal : m,
                  ),
                );
              }
            }}
            onReplaced={(newMeal) => {
              const updated = replacementsLeft - 1;
              setReplacementsLeft(updated);
              localStorage.setItem(
                `replacements_left_${user?._id}`,
                String(updated),
              );
              const originalMeal = selectedMeal;
              setSelectedMeal(newMeal);
              const isRepeat = !!user?.preferences?.repeatMealsEveryDay;
              if (isRepeat && originalMeal) {
                setCurrentMeals((prev) =>
                  prev.map((m) => {
                    const isSameMeal =
                      m._id === newMeal._id ||
                      (m.time === originalMeal.time &&
                        m.mealType === originalMeal.mealType) ||
                      m.name === originalMeal.name;
                    if (isSameMeal) {
                      return {
                        ...newMeal,
                        _id: m._id,
                        day: m.day,
                      };
                    }
                    return m;
                  }),
                );
              } else {
                setCurrentMeals((prev) =>
                  prev.map((m) => (m._id === newMeal._id ? newMeal : m)),
                );
              }
            }}
          />
        )}
      </AnimatePresence>

      {showInviteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed min-h-screen w-full start-0 top-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) =>
            e.target === e.currentTarget && setShowInviteModal(false)
          }
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="bg-card rounded-none sm:rounded-3xl w-full h-screen sm:h-auto sm:max-w-md shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-card-foreground text-lg">
                  {t("nutrition.addFamilyMember")}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t("nutrition.searchFamilyMember")}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  placeholder={t("nutrition.searchPlaceholder")}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-green-600 outline-none text-sm transition-all"
                />
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {isSearching ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-border border-t-green-600 rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm">{t("nutrition.searching")}</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors border border-transparent hover:border-border"
                    >
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-card-foreground text-sm">
                          {user.name}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {user.username}
                        </div>
                      </div>
                      {inviteStatus[user.id] === "sent" ? (
                        <div className="flex items-center gap-1 text-xs text-green-400 font-bold bg-green-500/10 px-3 py-1.5 rounded-xl">
                          <Check className="w-3 h-3" /> {t("nutrition.sent")}
                        </div>
                      ) : (
                        <button
                          onClick={() => sendInvite(user.id)}
                          disabled={inviteStatus[user.id] === "sending"}
                          className="text-xs bg-green-900/80 hover:bg-green-800 text-green-300 border border-green-700/50 shadow-sm transition-all duration-200 px-3 py-1.5 rounded-xl font-semibold disabled:opacity-50"
                        >
                          {inviteStatus[user.id] === "sending"
                            ? t("nutrition.sending")
                            : t("nutrition.invite")}
                        </button>
                      )}
                    </div>
                  ))
                ) : searchQuery.length >= 2 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t("nutrition.noUserFound")} "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {t("nutrition.typeToSearch")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      {showGenerateModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed min-h-screen w-full start-0 top-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) =>
            e.target === e.currentTarget && setShowGenerateModal(false)
          }
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="bg-card rounded-none sm:rounded-3xl w-full h-screen sm:h-auto sm:max-w-md shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-slate-900 to-green-900 rtl:bg-gradient-to-l p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-lg">
                    {t("nutrition.generateModalTitle")}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t("nutrition.generateModalSubtitle")}
                  </p>
                </div>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="p-2 text-muted-foreground hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Meals Counter */}
              <div>
                <label className="text-sm font-semibold text-card-foreground mb-2 block">
                  {t("nutrition.numberOfMeals")}
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() =>
                      setMealsCount((prev) => Math.max(1, prev - 1))
                    }
                    disabled={mealsCount <= 1}
                    className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30"
                  >
                    <Minus className="w-4 h-4 text-card-foreground" />
                  </button>
                  <span className="text-2xl font-bold text-card-foreground w-8 text-center">
                    {mealsCount}
                  </span>
                  <button
                    onClick={() =>
                      setMealsCount((prev) => Math.min(5, prev + 1))
                    }
                    disabled={mealsCount >= 5}
                    className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30"
                  >
                    <Plus className="w-4 h-4 text-card-foreground" />
                  </button>
                </div>
              </div>

              {/* Snacks Counter */}
              <div>
                <label className="text-sm font-semibold text-card-foreground mb-2 block">
                  {t("nutrition.numberOfSnacks")}
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() =>
                      setSnacksCount((prev) => Math.max(0, prev - 1))
                    }
                    disabled={snacksCount <= 0}
                    className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30"
                  >
                    <Minus className="w-4 h-4 text-card-foreground" />
                  </button>
                  <span className="text-2xl font-bold text-card-foreground w-8 text-center">
                    {snacksCount}
                  </span>
                  <button
                    onClick={() =>
                      setSnacksCount((prev) => Math.min(3, prev + 1))
                    }
                    disabled={snacksCount >= 3}
                    className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30"
                  >
                    <Plus className="w-4 h-4 text-card-foreground" />
                  </button>
                </div>
              </div>

              {/* Favorite Foods */}
              <div>
                <label className="text-sm font-semibold text-card-foreground mb-2 block">
                  {t("nutrition.favoriteFoods")}
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {favoriteFoods.map((food) => (
                    <span
                      key={food}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-semibold"
                    >
                      {food}
                      <button
                        onClick={() => removeFavoriteFood(food)}
                        className="hover:text-green-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={foodInput}
                  onChange={(e) => setFoodInput(e.target.value)}
                  onKeyDown={handleFoodKeyDown}
                  placeholder={t("nutrition.foodInputPlaceholder")}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-green-600 outline-none text-sm transition-all"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("nutrition.pressEnterToAdd")}
                </p>
              </div>

              {/* Repeat Meals Option */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-2xl border border-border">
                <div>
                  <label className="text-sm font-bold text-card-foreground block">
                    {t("nutrition.repeatMeals")}
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("nutrition.repeatMealsDesc")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRepeatMeals(!repeatMeals)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${repeatMeals ? "bg-green-800" : "bg-muted"}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out ${repeatMeals ? "ltr:translate-x-5 rtl:-translate-x-5" : "ltr:translate-x-0 rtl:translate-x-0"}`}
                  />
                </button>
              </div>

              <button
                onClick={handleGenerateWithConfig}
                className="w-full py-4 bg-gradient-to-r from-green-800 to-green-700 rtl:bg-gradient-to-l text-white rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" /> {t("nutrition.generatePlanButton")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <div className="flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground">
              {t("nutrition.title")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("nutrition.subtitle")}
            </p>
          </div>

          {!isNoPlan && (
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {!isGenerating && (
                <>
                  {user?.preferences?.familyPlan && (
                    <button
                      onClick={() => {
                        setIsFamilyMode(!isFamilyMode);
                        setActiveProfileId("me");
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${isFamilyMode ? "bg-green-500/10 text-green-400" : "bg-muted text-muted-foreground"}`}
                    >
                      {isFamilyMode ? (
                        <Users className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">
                        {isFamilyMode ? t('nutrition.familyPlan') : t('nutrition.soloMode')}
                      </span>
                    </button>
                  )}

                  <div className="flex bg-muted p-1 rounded-xl">
                    <button
                      onClick={() => handleViewModeChange("today")}
                      className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "today" ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground"}`}
                    >
                      <Clock className="w-3.5 h-3.5" />{" "}
                      <span className="hidden sm:inline">{t('nutrition.today')}</span>
                    </button>
                    <button
                      onClick={() => handleViewModeChange("week")}
                      className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "week" ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground"}`}
                    >
                      <CalendarDays className="w-3.5 h-3.5" />{" "}
                      <span className="hidden sm:inline">{t('nutrition.fullWeek')}</span>
                    </button>
                  </div>
                </>
              )}
              {generationLock.canGenerate ? (
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 15px 35px -5px rgba(22,101,52,0.35)",
                  }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    if (currentMeals.length > 0 && replacementsLeft <= 0) {
                      toast.error(
                        t("nutrition.replacementsLeft"),
                      );
                      return;
                    }
                    setShowGenerateModal(true);
                  }}
                  disabled={isGenerating}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-800 to-green-700 rtl:bg-gradient-to-l text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold shadow-lg shadow-black/20 disabled:opacity-50 relative overflow-hidden group text-sm sm:text-base cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          ease: "linear",
                        }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      <span>{t('nutrition.generating')}</span>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 rtl:bg-gradient-to-l -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      <Sparkles className="w-4 h-4" />
                      {t('nutrition.generate')} {viewMode === 'today' ? t('nutrition.today') : t('nutrition.fullWeek')}
                    </>
                  )}
                </motion.button>
              ) : (
                <div className="relative group">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled
                    className="flex items-center gap-2 bg-muted text-muted-foreground px-5 py-2.5 rounded-xl font-bold cursor-not-allowed"
                  >
                    <Lock className="w-4 h-4" />
                    {t('nutrition.generate')} {viewMode === 'today' ? t('nutrition.today') : t('nutrition.fullWeek')}
                  </motion.button>
                  {generationLock.message && (
                    <div className="absolute end-0 top-full mt-2 px-4 py-3 bg-popover text-popover-foreground text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        {generationLock.message}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isGenerating && (
                <button
                  onClick={() =>
                    window.open(`${API_URL}/export/nutrition/pdf`, "_blank")
                  }
                  disabled={generationLock.canGenerate}
                  className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground bg-card border border-border hover:bg-muted hover:text-green-400 hover:border-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:text-muted-foreground disabled:hover:border-border"
                  title={t("nutrition.exportPdfTitle")}
                >
                  <FileDown className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("nutrition.pdf")}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {!isNoPlan && !isGenerating && (
          <AnimatePresence>
            {isFamilyMode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                <div className="flex flex-nowrap sm:flex-wrap items-center gap-2 sm:gap-3 p-1 overflow-x-auto sm:overflow-x-visible pb-2 scrollbar-hide w-full -mx-2 sm:mx-0 px-2 sm:px-1">
                  {/* "You" Profile Button */}
                  <button
                    onClick={() => handleProfileChange("me")}
                      className={`shrink-0 flex items-center gap-2 sm:gap-3 ps-2 pe-3 sm:pe-5 py-1.5 sm:py-2 rounded-full border transition-all min-w-[120px] sm:min-w-[140px] ${
                       activeProfileId === "me"
                           ? "border-green-600 bg-green-500/10 ring-1 ring-green-500/30"
                           : "border-border hover:bg-muted bg-card"
                       }`}
                   >
                     <div className="w-7 sm:w-9 h-7 sm:h-9 rounded-full bg-green-500/10 flex items-center justify-center">
                       <User className="w-4 sm:w-5 h-4 sm:h-5 text-green-400" />
                    </div>
                    <div className="text-start">
                      <div
                        className={`font-bold text-xs sm:text-sm ${activeProfileId === "me" ? "text-card-foreground" : "text-muted-foreground"}`}
                      >
                        You
                      </div>
                      <div className="text-[9px] sm:text-[10px] font-medium text-muted-foreground">
                        {totals.calories} {t("nutrition.kcal")}
                      </div>
                    </div>
                  </button>

                  {/* Family Members Profile Buttons */}
                  {familyMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleProfileChange(member.id, member)}
                      className={`shrink-0 flex items-center gap-2 sm:gap-3 ps-2 pe-3 sm:pe-5 py-1.5 sm:py-2 rounded-full border transition-all min-w-[120px] sm:min-w-[140px] cursor-pointer ${
                        activeProfileId === member.id
                          ? "border-green-600 bg-green-500/10 ring-1 ring-green-500/30"
                          : "border-border hover:bg-muted bg-card"
                      }`}
                    >
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="w-7 sm:w-9 h-7 sm:h-9 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-7 sm:w-9 h-7 sm:h-9 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="text-start">
                        <div
                          className={`font-bold text-xs sm:text-sm ${activeProfileId === member.id ? "text-card-foreground" : "text-muted-foreground"}`}
                        >
                          {member.name}
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-medium text-muted-foreground">
                          {member.calories} {t("nutrition.kcal")}
                        </div>
                      </div>
                    </button>
                  ))}

                  {isFamilyMode && (
                    <div className="shrink-0 w-10 sm:w-14 h-10 sm:h-14 flex items-center justify-center rounded-full border transition-all duration-300 bg-card hover:bg-green-500/10 cursor-pointer">
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
        )}
      </div>
      <>
        {isGenerating ? (
          <MealPlanLoader />
        ) : (
          <>
            {!isNoPlan && nutritionPlan?.targetMacros.calories !== 0 && (
              <motion.div
                key={activeProfileId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                {[
                  {
                    label: t('nutrition.calories'),
                    current: totals.calories,
                    target: targetMacros.calories,
                    unit: t('nutrition.kcal'),
                    color: "bg-orange-500",
                  },
                  {
                    label: t('nutrition.protein'),
                    current: totals.protein,
                    target: targetMacros.protein,
                    unit: "g",
                    color: "bg-blue-500",
                  },
                  {
                    label: t('nutrition.carbs'),
                    current: totals.carbs,
                    target: targetMacros.carbs,
                    unit: "g",
                    color: "bg-green-800",
                  },
                  {
                    label: t('nutrition.fats'),
                    current: totals.fats,
                    target: targetMacros.fats,
                    unit: "g",
                    color: "bg-yellow-500",
                  },
                ].map((macro) => {
                  return (
                    <div
                      key={macro.label}
                      className="bg-card p-4 rounded-2xl border border-border shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-muted-foreground text-sm font-medium">
                          {macro.label}
                        </span>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="text-2xl font-bold text-card-foreground mb-2">
                        {macro.current}
                        <span className="text-sm font-normal text-muted-foreground">
                          {" "}
                          / {macro.unit}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${macro.color}`} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {getCalories(macro.label.toLowerCase(), macro.current)}{" "}
                        {t("nutrition.kcal")}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            <div className="space-y-4">
              {isLoadingMeals ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="w-8 h-8 border-4 border-border border-t-green-600 rounded-full animate-spin mx-auto mb-3" />
                  <p className="font-medium">{t('nutrition.loadingMeals')}</p>
                </div>
              ) : currentMeals.length > 0 ? (
                <>
                  {viewMode === "week" && (
                    <>
                      {(() => {
                        const mealsWithDay = currentMeals.filter((m) => m.day);
                        const mealsWithoutDay = currentMeals.filter(
                          (m) => !m.day,
                        );

                        return (
                          <>
                            {mealsWithDay.length > 0 && (
                              <div>
                                {mealsWithDay
                                  .reduce(
                                    (acc, meal, index) => {
                                      const currentDay = meal.day;
                                      const lastDay =
                                        acc.length > 0
                                          ? acc[acc.length - 1].day
                                          : null;

                                      if (currentDay !== lastDay) {
                                        acc.push({
                                          day: currentDay,
                                          meals: [meal],
                                          startIndex: index,
                                        });
                                      } else if (acc.length > 0) {
                                        acc[acc.length - 1].meals.push(meal);
                                      }
                                      return acc;
                                    },
                                    [] as {
                                      day: string | undefined;
                                      meals: Meal[];
                                      startIndex: number;
                                    }[],
                                  )
                                  .map((dayGroup, dayIndex) => (
                                    <div key={dayGroup.day || dayIndex}>
                                      <div className="flex items-center gap-3 my-4">
                                        <div className="h-px flex-1 bg-muted" />
                                        <span className="text-sm font-bold text-green-400 bg-green-500/10 px-3 py-1 rounded-full">
                                          {(() => {
                                            const dayNum = parseInt(
                                              (dayGroup.day || "").split(
                                                " ",
                                              )[1],
                                            );
                                            if (dayNum >= 1 && dayNum <= 7) {
                                              const today = new Date();
                                              const startOfWeek = new Date(
                                                today,
                                              );
                                              startOfWeek.setDate(
                                                today.getDate() -
                                                  today.getDay(),
                                              );
                                              const dayDate = new Date(
                                                startOfWeek,
                                              );
                                              dayDate.setDate(
                                                startOfWeek.getDate() +
                                                  dayNum -
                                                  1,
                                              );
                                              const weekday =
                                                dayDate.toLocaleDateString(
                                                  "en-US",
                                                  { weekday: "long" },
                                                );
                                              const monthDay =
                                                dayDate.toLocaleDateString(
                                                  "en-US",
                                                  {
                                                    month: "short",
                                                    day: "numeric",
                                                  },
                                                );
                                              return `${weekday}: ${monthDay}`;
                                            }
                                            return (
                                              dayGroup.day ||
                                              `Day ${dayIndex + 1}`
                                            );
                                          })()}
                                        </span>
                                        <div className="h-px flex-1 bg-muted" />
                                      </div>
                                      {dayGroup.meals.map((meal, mealIndex) => (
                                        <MealCard
                                          key={meal._id}
                                          meal={meal}
                                          index={
                                            dayGroup.startIndex + mealIndex
                                          }
                                          targetMacros={targetMacros}
                                          isFamilyMode={isFamilyMode}
                                          activeUser={activeUser}
                                          activeProfileId={activeProfileId}
                                          canInteract={isOwnProfile}
                                          onViewRecipe={() =>
                                            setSelectedMeal(meal)
                                          }
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
                                    <div className="h-px flex-1 bg-muted" />
                                    <span className="text-sm font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                      {t("nutrition.otherMeals")}
                                    </span>
                                    <div className="h-px flex-1 bg-muted" />
                                  </div>
                                )}
                                {mealsWithoutDay.map((meal, index) => (
                                  <MealCard
                                    key={meal._id}
                                    meal={meal}
                                    index={mealsWithDay.length + index}
                                    targetMacros={targetMacros}
                                    isFamilyMode={isFamilyMode}
                                    activeUser={activeUser}
                                    activeProfileId={activeProfileId}
                                    canInteract={isOwnProfile}
                                    onViewRecipe={() => setSelectedMeal(meal)}
                                  />
                                ))}
                              </>
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}
                  {viewMode === "today" &&
                    currentMeals.map((meal, index) => (
                      <MealCard
                        key={meal._id}
                        meal={meal}
                        index={index}
                        targetMacros={targetMacros}
                        isFamilyMode={isFamilyMode}
                        activeUser={activeUser}
                        activeProfileId={activeProfileId}
                        canInteract={isOwnProfile}
                        onViewRecipe={() => setSelectedMeal(meal)}
                      />
                    ))}
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-green-900 via-green-800 to-green-700 p-6 sm:p-10 text-white text-center"
                >
                  <div className="absolute top-0 end-0 w-64 h-64 bg-card/10 rounded-full blur-3xl -me-20 -mt-20 pointer-events-none" />
                  <div className="absolute bottom-0 start-0 w-48 h-48 bg-green-700/30 rounded-full blur-2xl -ms-10 -mb-10 pointer-events-none" />

                  <div className="relative z-10">
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: "easeInOut",
                      }}
                      className="w-14 h-14 sm:w-20 sm:h-20 bg-card/20 backdrop-blur-sm rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl"
                    >
                      <Utensils className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
                    </motion.div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">
                      {t("nutrition.noPlanTitle")}
                    </h2>
                    <p className="text-xs sm:text-sm md:text-base text-green-200 mb-6 sm:mb-8 max-w-xs sm:max-w-md mx-auto leading-relaxed">
                      {t("nutrition.noPlanDesc")}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setShowGenerateModal(true)}
                      disabled={isGenerating}
                      className="cursor-pointer bg-card text-green-400 px-5 py-2.5 sm:px-8 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-lg flex items-center gap-2.5 sm:gap-3 mx-auto hover:bg-green-500/10 transition-colors shadow-xl disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>{t("nutrition.generating")}</>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>{t("nutrition.buildMyPlan")}</span>
                          <span>→</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          </>
        )}
      </>
    </div>
  );
};
