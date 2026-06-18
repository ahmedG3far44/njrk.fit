import React, { useState, useEffect, useRef } from 'react';
import { User, Bell, Shield, Scale, Ruler, Target, CreditCard, Users, Stethoscope, Sparkles, UtensilsCrossed, ChevronRight, Save, LogOut, Loader2, Pencil, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { useAuth } from '../context/AuthProvider';
import { userService } from '../services/userService';
import { subscriptionService } from '../services/subscriptionService';
import { authService } from '../services/authService';
import GoalProgressBar from './GoalProgressBar';
import { Button } from './ui/button';

export const Settings: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const { user, logout, refreshUser, isGoogleUser } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const handleThemeToggle = () => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)

  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    status: string;
    planName?: string;
    subscriptionTier?: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    height: (user?.height as number) || 0,
    weight: (user?.weight as number) || 0,
    goal: (user?.goal as "lose_weight" | "gain_weight" | "maintain_weight") || 'maintain_weight',
    religion: (user?.religion as string) || '',
    notifications: localStorage.getItem('daily_reminder_enabled') !== 'false',
    familyPlan: user?.preferences?.familyPlan ?? (user?.subscriptionTier === 'FAMILY' || user?.subscriptionTier === 'PRO'),
    autoGenerateMeals: user?.preferences?.autoGenerateMeals ?? true,
    manualPrompt: user?.preferences?.manualPrompt ?? '',
    weeklySummary: user?.preferences?.weeklySummary ?? true,
    mealReminders: user?.preferences?.mealReminders ?? true,
    isFasting: user?.preferences?.isFasting ?? false,
    foodPreferences: user?.dietaryRestrictions || [] as string[],
    allergies: user?.allergies || [] as string[],

  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        height: (user.height as number) || 0,
        weight: (user.weight as number) || 0,
        goal: (user.goal as "lose_weight" | "gain_weight" | "maintain_weight") || '',

        religion: (user?.religion as string) || '',
        foodPreferences: user?.dietaryRestrictions || [],
        allergies: user?.allergies || [],
        notifications: localStorage.getItem('daily_reminder_enabled') !== 'false',
        weeklySummary: user?.preferences?.weeklySummary ?? true,
        mealReminders: user?.preferences?.mealReminders ?? true,
        autoGenerateMeals: user?.preferences?.autoGenerateMeals ?? true,
        isFasting: user?.preferences?.isFasting ?? false,
        familyPlan: user?.preferences?.familyPlan ?? (user?.subscriptionTier === 'FAMILY' || user?.subscriptionTier === 'PRO'),
        manualPrompt: user?.preferences?.manualPrompt ?? '',
      }));
    }
  }, [user]);

  // Fetch subscription status
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const status = await subscriptionService.getStatus();
        setSubscriptionInfo({
          status: status.status,
          planName: status.planName,
          subscriptionTier: status.subscriptionTier,
        });
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      }
    };
    fetchSubscription();
  }, []);

  const handleSaveAll = async () => {
    await handleSaveProfile();
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await userService.updateProfile({
        name: formData.name,
        height: formData.height,
        weight: formData.weight,
        preferences: {
          notifications: formData.notifications,
          weeklySummary: formData.weeklySummary,
          mealReminders: formData.mealReminders,
          familyPlan: formData.familyPlan,
          autoGenerateMeals: formData.autoGenerateMeals,
          isFasting: formData.isFasting,
          manualPrompt: formData.manualPrompt,
        },
      });

      await refreshUser();
      toast.success(t('settings.profileUpdated'));
      setIsEditMode(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error(t('settings.profileUpdateFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const { t } = useTranslation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      await userService.uploadAvatar(file);
      await refreshUser();
      toast.success(t('settings.profilePictureUpdated'));
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      toast.error(t('settings.avatarUploadFailed'));
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleVerifyEmail = async () => {
    setIsVerifyingEmail(true);
    try {
      await authService.resendVerification();
      toast.success(t('settings.verificationSent'));
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : t('settings.verificationSendFailed');
      toast.error(msg);
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-8 pb-12 relative">
      {/* Logout Confirmation */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <LogOut className="w-5 h-5 sm:w-7 sm:h-7 text-red-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-card-foreground mb-1.5 sm:mb-2">{t('settings.logoutTitle')}</h3>
              <p className="text-muted-foreground text-xs sm:text-sm mb-5 sm:mb-6 leading-relaxed">
                {t('settings.logoutMessage')}
              </p>
              <div className="flex gap-2.5 sm:gap-3">
                <Button variant="secondary" size="default" className="flex-1" onClick={() => setShowLogoutConfirm(false)}>
                  {t('settings.cancel')}
                </Button>
                <Button variant="destructive" size="default" className="flex-1" onClick={() => { setShowLogoutConfirm(false); handleLogout(); }}>
                  {t('settings.logoutConfirm')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground leading-tight">{t('settings.title')}</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">{t('settings.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {mounted && (
            <Button variant="secondary" size="sm" onClick={handleThemeToggle}>
              {resolvedTheme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              <span>{resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </Button>
          )}
          <Button variant={isEditMode ? 'primary' : 'secondary'} size="sm" onClick={() => setIsEditMode(!isEditMode)}>
            <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{isEditMode ? t('settings.cancel') : t('settings.edit')}</span>
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-card p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-border shadow-sm space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3 sm:gap-4 border-b border-border pb-4 sm:pb-6">
          <div
            className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-muted overflow-hidden relative group cursor-pointer flex items-center justify-center flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadingAvatar ? (
              <Loader2 className="w-5 h-5 sm:w-8 sm:h-8 text-white animate-spin" />
            ) : user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 sm:w-10 sm:h-10 text-muted-foreground" />
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] sm:text-xs text-white font-bold">{t('settings.editAvatar')}</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-xl font-bold text-card-foreground truncate">{user?.name || formData.name || t('settings.yourName')}</h3>
            <p className="text-muted-foreground text-xs sm:text-sm truncate">{user?.email || formData.email || t('settings.updateProfile')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-card-foreground flex items-center gap-2">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" /> {t('settings.fullName')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditMode}
              className={`w-full px-3.5 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-border focus:ring-2 focus:ring-green-600 outline-none transition-all text-xs sm:text-sm ${!isEditMode ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}`}
              placeholder={t('settings.namePlaceholder')}
            />
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-card-foreground flex items-center gap-2">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" /> {t('settings.email')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={formData.email}
                disabled
                className="flex-1 w-full px-3.5 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-border bg-muted text-muted-foreground text-xs sm:text-sm cursor-not-allowed"
                placeholder={t('settings.emailPlaceholder')}
              />
              {!isGoogleUser && (
                  <span className={`shrink-0 px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold ${user?.isEmailVerified
                    ? 'bg-green-900/30 text-green-400'
                    : 'bg-amber-900/30 text-amber-400'
                    }`}>
                  {user?.isEmailVerified ? t('settings.emailVerified') : t('settings.emailNotVerified')}
                </span>
              )}
            </div>
            {!isGoogleUser && !user?.isEmailVerified && (
              <Button variant="ghost" size="sm" loading={isVerifyingEmail} onClick={handleVerifyEmail} className="mt-1 text-green-400">
                {!isVerifyingEmail && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                )}
                {t('settings.verifyEmail')}
              </Button>
            )}
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-card-foreground flex items-center gap-2">
              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" /> {t('settings.goal')}
            </label>
            <select
              value={formData.goal}
              onChange={e => setFormData({ ...formData, goal: e.target.value as "lose_weight" | "gain_weight" | "maintain_weight" })}
              disabled={!isEditMode}
              className={`w-full px-3.5 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-border focus:ring-2 focus:ring-green-600 outline-none transition-all bg-card text-xs sm:text-sm ${!isEditMode ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}`}
            >
              <option value="">{t('settings.goalSelect')}</option>
              <option value="lose_weight">{t('settings.goalLoseWeight')}</option>
              <option value="gain_weight">{t('settings.goalGainWeight')}</option>
              <option value="maintain_weight">{t('settings.goalMaintainWeight')}</option>
            </select>
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-card-foreground flex items-center gap-2">
              <Ruler className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" /> {t('settings.heightCm')}
            </label>
            <input
              type="number"
              value={formData.height || ''}
              onChange={e => setFormData({ ...formData, height: Number(e.target.value) })}
              disabled={!isEditMode}
              className={`w-full px-3.5 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-border focus:ring-2 focus:ring-green-600 outline-none transition-all text-xs sm:text-sm ${!isEditMode ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}`}
              placeholder="175"
            />
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-card-foreground flex items-center gap-2">
              <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" /> {t('settings.weightKg')}
            </label>
            <input
              type="number"
              value={formData.weight || ''}
              onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })}
              disabled={!isEditMode}
              className={`w-full px-3.5 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-border focus:ring-2 focus:ring-green-600 outline-none transition-all text-xs sm:text-sm ${!isEditMode ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}`}
              placeholder="70"
            />
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-card-foreground flex items-center gap-2">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" /> {t('settings.religion')}
            </label>
            <input
              type="text"
              value={user?.religion as "muslim" | "christian"}
              disabled
              className="w-full px-3.5 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-border bg-muted text-muted-foreground text-xs sm:text-sm cursor-not-allowed"
              placeholder={t('settings.religionPlaceholder')}
            />
          </div>
        </div>

        {/* Save Button - Only visible in edit mode */}
        {isEditMode && (
          <div className="flex justify-end pt-2">
            <Button variant="primary" loading={isSaving} onClick={handleSaveProfile} className="w-full sm:w-auto">
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{isSaving ? t('settings.saving') : t('settings.saveChanges')}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Goal Progress */}
      <GoalProgressBar user={user} />

      {/* Medical Profile */}
      <div className="bg-card p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-border shadow-sm space-y-4 sm:space-y-6">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-red-500" />
          <h3 className="text-base sm:text-lg font-bold text-card-foreground">{t('settings.medicalProfile')}</h3>
        </div>
        <div className="space-y-2.5 sm:space-y-3">
          <div className="p-3 sm:p-4 bg-muted rounded-lg sm:rounded-xl border border-border">
            <div className="flex justify-between items-center mb-1.5 sm:mb-2">
              <span className="font-semibold text-card-foreground text-xs sm:text-sm">{t('settings.activeConditions')}</span>
            </div>
            <div className="flex gap-1.5 sm:gap-2">
                <span className="bg-card border border-border px-2.5 py-1 rounded-md sm:rounded-lg text-xs sm:text-sm text-muted-foreground">{t('settings.none')}</span>
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-muted rounded-lg sm:rounded-xl border border-border">
            <div className="flex justify-between items-center mb-1.5 sm:mb-2">
              <span className="font-semibold text-card-foreground text-xs sm:text-sm">{t('settings.foodPreferences')}</span>
            </div>
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              {formData.foodPreferences && formData.foodPreferences.length > 0 ? (
                formData.foodPreferences.map((food, index) => (
                  <span key={index} className="bg-green-900/30 border border-green-800/30 px-2.5 py-1 rounded-md sm:rounded-lg text-xs sm:text-sm text-green-400">{food}</span>
                ))
              ) : (
                <span className="bg-card border border-border px-2.5 py-1 rounded-md sm:rounded-lg text-xs sm:text-sm text-muted-foreground">{t('settings.noneSelected')}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-card p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-border shadow-sm space-y-0 divide-y divide-border">
        <h3 className="text-base sm:text-lg font-bold text-card-foreground pb-3 sm:pb-5">{t('settings.preferences')}</h3>

        {/* Daily Reminders */}
        <div className="flex items-center justify-between gap-3 py-4 sm:py-5">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl flex-shrink-0 ${formData.notifications ? 'bg-green-900/30 text-green-400' : 'bg-muted text-muted-foreground'}`}>
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-card-foreground text-xs sm:text-sm">{t('settings.dailyReminders')}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t('settings.dailyRemindersDesc')}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input
              type="checkbox"
              checked={formData.notifications}
              onChange={e => {
                const checked = e.target.checked;
                setFormData({ ...formData, notifications: checked });
                localStorage.setItem('daily_reminder_enabled', checked ? 'true' : 'false');
                
                if (checked) {
                  const isMeal = Math.random() > 0.5;
                  const mealReminders = [
                    "Time for your healthy meal! Don't forget to track your calories and macros in the Nutrition tab.",
                    "Lunch Reminder: Make sure to consume your target protein for optimal muscle recovery.",
                    "Dinner Time! Enjoy a light, high-protein meal to stay in line with your fitness goals.",
                    "Pre-workout nutrition check! Fuel up with some quality carbs before your training session."
                  ];
                  const trainingReminders = [
                    "It's time for your workout session! Consistency is key to achieving your fitness goals.",
                    "Get ready to sweat! Your scheduled training session is waiting. Let's crush it!",
                    "Time to move! Keep your daily streak alive with a 30-minute training session.",
                    "Fitness alert: Hydrate well and start your warm-up. Today's workout is ready!"
                  ];
                  
                  const type = isMeal ? 'meal_reminder' : 'training_reminder';
                  const title = isMeal ? 'Meal Reminder' : 'Training Session';
                  const message = isMeal 
                    ? mealReminders[Math.floor(Math.random() * mealReminders.length)]
                    : trainingReminders[Math.floor(Math.random() * trainingReminders.length)];
                    
                  const newNotif = {
                    id: `local_${type}_${Date.now()}`,
                    type,
                    title,
                    message,
                    time: 'Just now',
                    isLocal: true,
                    isRead: false
                  };
                  
                  const stored = localStorage.getItem('local_notifications');
                  const existing = stored ? JSON.parse(stored) : [];
                  localStorage.setItem('local_notifications', JSON.stringify([newNotif, ...existing]));
                  
                  // Dispatch a custom event to notify components
                  window.dispatchEvent(new Event('localNotificationsUpdated'));
                  toast.success(t('settings.reminderEnabled'));
                } else {
                  toast.success(t('settings.reminderDisabled'));
                }
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-700"></div>
          </label>
        </div>

        {/* Family Plan */}
        <div className="flex items-center justify-between gap-3 py-4 sm:py-5">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl flex-shrink-0 ${formData.familyPlan ? 'bg-blue-900/30 text-blue-400' : 'bg-muted text-muted-foreground'}`}>
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-card-foreground text-xs sm:text-sm">{t('settings.familyPlan')}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t('settings.familyPlanDesc')}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input type="checkbox" checked={formData.familyPlan} onChange={e => setFormData({ ...formData, familyPlan: e.target.checked })} className="sr-only peer" />
            <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Repeats meals of week */}
        <div className="py-4 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl flex-shrink-0 ${formData.autoGenerateMeals ? 'bg-green-900/30 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-card-foreground text-xs sm:text-sm">{t('settings.repeatMeals')}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  {formData.autoGenerateMeals ? t('settings.repeatMealsOn') : t('settings.repeatMealsOff')}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input type="checkbox" checked={formData.autoGenerateMeals} onChange={e => setFormData({ ...formData, autoGenerateMeals: e.target.checked })} className="sr-only peer" />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-700"></div>
            </label>
          </div>

          <AnimatePresence>
            {!formData.autoGenerateMeals && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3.5 p-3.5 bg-gray-800/50 border border-orange-500/30 rounded-lg sm:rounded-xl space-y-2.5 sm:space-y-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <UtensilsCrossed className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-orange-300">{t('settings.manualPrompt')}</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-300">{t('settings.manualPromptDesc')}</p>
                  <textarea
                    value={formData.manualPrompt}
                    onChange={e => setFormData({ ...formData, manualPrompt: e.target.value })}
                    rows={3}
                    placeholder='e.g. "Focus on high-protein, low-carb meals. I have chicken, eggs, and broccoli in the fridge..."'
                    className="w-full px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-gray-700 focus:ring-2 focus:ring-orange-500/50 outline-none text-xs resize-none bg-gray-900 text-gray-200"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Fasting - Only for non-Muslim users */}
        {((user?.religion as string)?.toLowerCase() !== 'muslim') && (
          <div className="flex items-center justify-between gap-3 py-4 sm:py-5">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl flex-shrink-0 ${formData.isFasting ? 'bg-purple-900/30 text-purple-400' : 'bg-muted text-muted-foreground'}`}>
                <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-card-foreground text-xs sm:text-sm">
                  {t('settings.fasting')}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t('settings.fastingDesc')}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={formData.isFasting}
                onChange={e => setFormData({ ...formData, isFasting: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-700"></div>
            </label>
          </div>
        )}

        {/* Subscription */}
        <div className="flex items-center justify-between gap-3 py-4 sm:py-5">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="bg-green-900/30 p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-green-400 flex-shrink-0">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-card-foreground text-xs sm:text-sm">{t('settings.subscription')}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t('settings.subscriptionDesc')}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 flex-shrink-0">
            <span className={`px-2 py-0.5 rounded-md text-[9px] sm:text-xs font-bold ${subscriptionInfo?.subscriptionTier === 'pro' ? 'bg-amber-900/30 text-amber-400' :
              subscriptionInfo?.subscriptionTier === 'family' ? 'bg-blue-900/30 text-blue-400' :
                'bg-muted text-muted-foreground'
              }`}>
              {subscriptionInfo?.subscriptionTier === 'pro' && t('settings.pro')}
              {subscriptionInfo?.subscriptionTier === 'family' && t('settings.family')}
              {(!subscriptionInfo?.subscriptionTier || subscriptionInfo?.subscriptionTier === 'basic') && t('settings.free')}
            </span>
            {subscriptionInfo?.status === 'active' && (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-green-900/30 text-green-400">
                {t('settings.active')}
              </span>
            )}
            {subscriptionInfo?.status === 'canceled' && (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-red-900/30 text-red-400">
                {t('settings.canceled')}
              </span>
            )}
            <button
              onClick={() => window.location.href = '/dashboard/subscriptions'}
              className="flex items-center gap-0.5 cursor-pointer text-green-400 font-bold text-xs sm:text-sm hover:underline"
            >
              {t('settings.manage')} <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="flex items-center justify-between gap-3 py-4 sm:py-5">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="bg-red-500/10 p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-red-500 flex-shrink-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-card-foreground text-xs sm:text-sm">{t('settings.privacySecurity')}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t('settings.privacyDesc')}</p>
            </div>
          </div>
          <button className="flex items-center gap-0.5 text-green-400 font-bold text-xs sm:text-sm hover:underline flex-shrink-0">
            {t('settings.view')} <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="primary" loading={isSaving} onClick={handleSaveAll} className="w-full sm:w-auto">
          {isSaving ? t('settings.saving') : <><Save className="w-4 h-4 sm:w-5 sm:h-5" /> {t('settings.saveChanges')}</>}
        </Button>
      </div>

      {/* Log Out Section */}
      <div className="bg-card rounded-2xl sm:rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-red-500/10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <LogOut className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-card-foreground text-xs sm:text-sm">{t('settings.logout')}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t('settings.logoutDesc')}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowLogoutConfirm(true)} className="text-red-500 bg-red-500/10 hover:bg-red-500/20">
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
};