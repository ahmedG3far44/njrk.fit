import React, { useState, useEffect, useRef } from 'react';
import { User, Bell, Shield, Scale, Ruler, Target, CreditCard, Users, Stethoscope, Sparkles, UtensilsCrossed, ChevronRight, Save, LogOut, Loader2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthProvider';
import { userService } from '../services/userService';
import { subscriptionService } from '../services/subscriptionService';

export const Settings: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const { user, logout, refreshUser } = useAuth();

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false)

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
      toast.success('Profile updated successfully!');
      setIsEditMode(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

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
      toast.success('Profile picture updated!');
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12 relative">
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
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Log Out?</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                You'll be returned to the landing page. Your data is always saved.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowLogoutConfirm(false); handleLogout(); }}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors text-sm"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings & Profile</h1>
          <p className="text-slate-500">Manage your personal data and preferences.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`p-3 border rounded-2xl transition-colors shadow-sm cursor-pointer flex items-center gap-2 ${isEditMode
              ? 'bg-green-600 border-green-600 text-white'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
          >
            <Pencil className="w-4 h-4" />
            <span className="text-sm font-medium">{isEditMode ? 'Cancel' : 'Edit'}</span>
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div
            className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden relative group cursor-pointer flex items-center justify-center"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadingAvatar ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-slate-400" />
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-white font-bold">Edit</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{user?.name || formData.name || 'Your Name'}</h3>
            <p className="text-slate-500">{user?.email || formData.email || 'Update your profile'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4 text-green-700" /> Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditMode}
              className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-600 outline-none transition-all text-sm ${!isEditMode ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4 text-green-700" /> Email
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
              placeholder="your@email.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Target className="w-4 h-4 text-green-700" /> Goal
            </label>
            <select
              value={formData.goal}
              onChange={e => setFormData({ ...formData, goal: e.target.value as "lose_weight" | "gain_weight" | "maintain_weight" })}
              disabled={!isEditMode}
              className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-600 outline-none transition-all bg-white text-sm ${!isEditMode ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
            >
              <option value="">Select goal</option>
              <option value="lose_weight">Lose Weight</option>
              <option value="gain_weight">Gain Weight</option>
              <option value="maintain_weight">Maintain Weight</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Ruler className="w-4 h-4 text-green-700" /> Height (cm)
            </label>
            <input
              type="number"
              value={formData.height || ''}
              onChange={e => setFormData({ ...formData, height: Number(e.target.value) })}
              disabled={!isEditMode}
              className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-600 outline-none transition-all text-sm ${!isEditMode ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
              placeholder="175"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Scale className="w-4 h-4 text-green-700" /> Weight (kg)
            </label>
            <input
              type="number"
              value={formData.weight || ''}
              onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })}
              disabled={!isEditMode}
              className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-600 outline-none transition-all text-sm ${!isEditMode ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
              placeholder="70"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4 text-green-700" /> Religion
            </label>
            <input
              type="text"
              value={user?.religion as "muslim" | "christian"}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
              placeholder="Religion"
            />
          </div>
        </div>

        {/* Save Button - Only visible in edit mode */}
        {isEditMode && (
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-green-700 text-white font-semibold rounded-xl hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Medical Profile */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-bold text-slate-900">Medical Profile</h3>
        </div>
        <div className="space-y-3">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-slate-700 text-sm">Active Conditions</span>

            </div>
            <div className="flex gap-2">
              <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-sm text-slate-600">None</span>
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-slate-700 text-sm">Allergies</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {formData.allergies && formData.allergies.length > 0 ? (
                formData.allergies.map((allergy, index) => (
                  <span key={index} className="bg-red-50 border border-red-200 px-3 py-1 rounded-lg text-sm text-red-600">{allergy}</span>
                ))
              ) : (
                <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-sm text-slate-600">None</span>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-slate-700 text-sm">Food Preferences</span>
              {/* <button className="text-xs font-bold text-green-700 uppercase hover:underline">Update</button> */}
            </div>
            <div className="flex gap-2 flex-wrap">
              {formData.foodPreferences && formData.foodPreferences.length > 0 ? (
                formData.foodPreferences.map((food, index) => (
                  <span key={index} className="bg-green-50 border border-green-200 px-3 py-1 rounded-lg text-sm text-green-600">{food}</span>
                ))
              ) : (
                <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-sm text-slate-600">None selected</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-0 divide-y divide-slate-50">
        <h3 className="text-lg font-bold text-slate-900 pb-5">Preferences</h3>

        {/* Daily Reminders */}
        <div className="flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-2.5 rounded-xl text-green-700">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Daily Reminders</p>
              <p className="text-xs text-slate-500">Meal times, workout alerts, streak warnings</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
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
                  toast.success('Daily Reminder enabled and notification sent!');
                } else {
                  toast.success('Daily Reminder disabled');
                }
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-700"></div>
          </label>
        </div>

        {/* Family Plan */}
        <div className="flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Family Plan Management</p>
              <p className="text-xs text-slate-500">Master switch: enables family section across all pages</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={formData.familyPlan} onChange={e => setFormData({ ...formData, familyPlan: e.target.checked })} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Repeats meals of week */}
        <div className="py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${formData.autoGenerateMeals ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400'}`}>
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Repeats meals of week</p>
                <p className="text-xs text-slate-500">
                  {formData.autoGenerateMeals ? 'The daily meals will be the same' : 'The daily meals will different than other days'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={formData.autoGenerateMeals} onChange={e => setFormData({ ...formData, autoGenerateMeals: e.target.checked })} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-700"></div>
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
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-bold text-amber-800">Manual Generation Prompt</span>
                  </div>
                  <p className="text-xs text-amber-700">This prompt appears in the Nutrition page when you manually generate meals.</p>
                  <textarea
                    value={formData.manualPrompt}
                    onChange={e => setFormData({ ...formData, manualPrompt: e.target.value })}
                    rows={3}
                    placeholder='e.g. "Focus on high-protein, low-carb meals. I have chicken, eggs, and broccoli in the fridge..."'
                    className="w-full px-3 py-2.5 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-400 outline-none text-xs resize-none bg-white"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Fasting - Only for non-Muslim users */}
        {((user?.religion as string)?.toLowerCase() !== 'muslim') && (
          <div className="flex items-center justify-between py-5">
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 p-2.5 rounded-xl text-purple-700">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">
                  {((user?.religion as string)?.toLowerCase() === 'christian') ? 'Fasting' : 'Fasting'}
                </p>
                <p className="text-xs text-slate-500">Fasting periods, religious diet</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFasting}
                onChange={e => setFormData({ ...formData, isFasting: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-700"></div>
            </label>
          </div>
        )}

        {/* Subscription */}
        <div className="flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-2.5 rounded-xl text-green-700">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Subscription</p>
              <p className="text-xs text-slate-500">Manage your subscription plan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${subscriptionInfo?.subscriptionTier === 'pro' ? 'bg-amber-100 text-amber-700' :
              subscriptionInfo?.subscriptionTier === 'family' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-600'
              }`}>
              {subscriptionInfo?.subscriptionTier === 'pro' && 'Pro'}
              {subscriptionInfo?.subscriptionTier === 'family' && 'Family'}
              {(!subscriptionInfo?.subscriptionTier || subscriptionInfo?.subscriptionTier === 'basic') && 'Free'}
            </span>
            {subscriptionInfo?.status === 'active' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                Active
              </span>
            )}
            {subscriptionInfo?.status === 'canceled' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                Canceled
              </span>
            )}
            <button
              onClick={() => window.location.href = '/dashboard/subscriptions'}
              className="flex items-center gap-1 cursor-pointer text-green-700 font-bold text-sm hover:underline"
            >
              Manage <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 p-2.5 rounded-xl text-red-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Privacy & Security</p>
              <p className="text-xs text-slate-500">Data encryption, 2FA, account deletion</p>
            </div>
          </div>
          <button className="flex items-center gap-1 text-green-700 font-bold text-sm hover:underline">
            View <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="inline-flex items-center gap-2 bg-green-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-800 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-5 h-5" /> Save Changes</>
          )}
        </button>
      </div>

      {/* Log Out Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Log Out</p>
              <p className="text-xs text-slate-500">Sign out of your Njerka account</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors text-sm border border-red-100"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};