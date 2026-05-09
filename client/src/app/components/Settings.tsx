import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Scale, Ruler, Target, CreditCard, Users, Stethoscope, Sparkles, Check, X, UserCheck, UtensilsCrossed, Clock, ChevronRight, Save, LogOut, Loader2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthProvider';
import { familyService, PendingInvitation } from '../services/familyService';
import { userService } from '../services/userService';

interface Notification {
  id: string;
  type: 'friend_request' | 'family_invite' | 'meal_reminder' | 'team_invite';
  title: string;
  message: string;
  avatar?: string;
  time: string;
  invitationId?: string;
}

export const Settings: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const { user, logout } = useAuth();

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    height: (user?.height as number) || 0,
    weight: (user?.weight as number) || 0,
    goal: (user?.goal as "lose_weight" | "gain_weight" | "maintain_weight") || 'maintain_weight',
    religion: (user?.religion as string) || '',
    notifications: true,
    familyPlan: false,
    autoGenerateMeals: true,
    manualPrompt: '',
    fasting: false,
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
      }));
    }
  }, [user]);

  const [saved, setSaved] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [respondedNotifs, setRespondedNotifs] = useState<Record<string, 'accepted' | 'declined'>>({});

  // Fetch pending invitations
  useEffect(() => {
    const fetchInvitations = async () => {
      setLoadingInvitations(true);
      try {
        const response = await familyService.getFamily();

        // Map pending invitations to notification format
        const inviteNotifications: Notification[] = response.pendingInvitations.map((invite: PendingInvitation) => ({
          id: invite.id,
          type: 'family_invite' as const,
          title: invite.user?.name || 'Family Invitation',
          message: `${invite.user?.name || 'Someone'} invited you to join their family plan`,
          avatar: invite.user?.avatarUrl,
          time: 'Just now',
          invitationId: invite.id,
        }));

        setNotifications(inviteNotifications);
      } catch (error) {
        console.error('Failed to fetch invitations:', error);
      } finally {
        setLoadingInvitations(false);
      }
    };

    if (showNotifications) {
      fetchInvitations();
    }
  }, [showNotifications]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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
          weeklySummary: true,
          mealReminders: true,
        },
      });

      toast.success('Profile updated successfully!');
      setIsEditMode(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotifResponse = async (id: string, response: 'accepted' | 'declined') => {
    const notif = notifications.find(n => n.id === id);
    if (!notif?.invitationId) return;

    setRespondingId(id);
    try {
      const action = response === 'accepted' ? 'accept' : 'reject';
      await familyService.respondToInvitation(notif.invitationId, action);

      setRespondedNotifs(prev => ({ ...prev, [id]: response }));
      toast.success(response === 'accepted' ? 'Invitation accepted!' : 'Invitation declined');

      // Remove from list after a delay
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 1500);
    } catch (error) {
      console.error('Failed to respond to invitation:', error);
      toast.error('Failed to respond. Please try again.');
    } finally {
      setRespondingId(null);
    }
  };

  const dismissNotif = (id: string) => {
    // In real app, this would call an API
  };

  const notifCount = notifications.filter(n => !respondedNotifs[n.id]).length;

  const notifTypeIcon = (type: string) => {
    if (type === 'friend_request') return <UserCheck className="w-4 h-4 text-green-700" />;
    if (type === 'family_invite') return <Users className="w-4 h-4 text-green-600" />;
    if (type === 'meal_reminder') return <Clock className="w-4 h-4 text-orange-500" />;
    if (type === 'team_invite') return <Target className="w-4 h-4 text-green-500" />;
    return <Bell className="w-4 h-4 text-slate-500" />;
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 16 }}
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

      {/* Notification Sidebar */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-0 left-0 right-0 bottom-0 w-screen min-h-screen z-50 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowNotifications(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: 400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed top-0 right-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col h-full"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-green-900 to-green-700 text-white">
                <div>
                  <h3 className="font-bold text-lg">Notification Center</h3>
                  <p className="text-green-200 text-sm">{notifCount} new notifications</p>
                </div>
                <button onClick={() => setShowNotifications(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingInvitations ? (
                  <div className="text-center py-12 text-slate-400">
                    <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-green-600" />
                    <p className="font-medium">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">All caught up!</p>
                    <p className="text-sm">No new notifications</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <motion.div
                      key={notif.id}
                      layout
                      className={`bg-white border rounded-2xl p-4 shadow-sm ${respondedNotifs[notif.id] ? 'opacity-60 border-slate-100' : 'border-slate-200'}`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="relative flex-shrink-0">
                          {notif.avatar ? (
                            <img src={notif.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                              {notifTypeIcon(notif.type)}
                            </div>
                          )}
                          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                            {notifTypeIcon(notif.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-slate-900 text-sm">{notif.title}</span>
                            <button onClick={() => dismissNotif(notif?.id)} className="text-slate-300 hover:text-slate-500 flex-shrink-0">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-slate-600 text-xs leading-relaxed mt-0.5">{notif.message}</p>
                          <p className="text-slate-400 text-[10px] mt-1">{notif.time}</p>
                        </div>
                      </div>

                      {(notif.type === 'family_invite') && !respondedNotifs[notif.id] && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleNotifResponse(notif.id, 'accepted')}
                            disabled={respondingId === notif.id}
                            className="flex-1 py-2 bg-green-700 text-white rounded-xl text-xs font-bold hover:bg-green-800 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            {respondingId === notif.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" /> Accept
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleNotifResponse(notif.id, 'declined')}
                            disabled={respondingId === notif.id}
                            className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
                          >
                            {respondingId === notif.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              'Decline'
                            )}
                          </button>
                        </div>
                      )}

                      {respondedNotifs[notif.id] && (
                        <div className={`text-xs font-bold text-center py-1.5 rounded-xl ${respondedNotifs[notif.id] === 'accepted' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                          {respondedNotifs[notif.id] === 'accepted' ? '✓ Accepted' : '✕ Declined'}
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
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
          <button
            onClick={() => setShowNotifications(true)}
            className="relative p-3 cursor-pointer bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {notifCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {notifCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden relative group cursor-pointer flex items-center justify-center">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-slate-400" />
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-white font-bold">Edit</span>
            </div>
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
              <button className="text-xs font-bold text-green-700 uppercase hover:underline">Update</button>
            </div>
            <div className="flex gap-2">
              <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-sm text-slate-600">None</span>
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-slate-700 text-sm">Allergies</span>
              <button className="text-xs font-bold text-green-700 uppercase hover:underline">Update</button>
            </div>
            <div className="flex gap-2">
              <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-sm text-slate-600">None</span>
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
            <input type="checkbox" checked={formData.notifications} onChange={e => setFormData({ ...formData, notifications: e.target.checked })} className="sr-only peer" />
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

        {/* Auto-Generate Meals */}
        <div className="py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${formData.autoGenerateMeals ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400'}`}>
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Auto-Generate Meals</p>
                <p className="text-xs text-slate-500">
                  {formData.autoGenerateMeals ? 'AI automatically plans meals daily' : 'Manual: you control meal generation'}
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
                checked={formData.fasting}
                onChange={e => setFormData({ ...formData, fasting: e.target.checked })}
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
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${user?.subscriptionTier === 'premium' ? 'bg-amber-100 text-amber-700' :
              user?.subscriptionTier === 'family' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-600'
              }`}>
              {user?.subscriptionTier || 'Free'}
            </span>
            <button className="flex items-center gap-1 text-green-700 font-bold text-sm hover:underline">
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
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${saved ? 'bg-green-500 shadow-green-200' : 'bg-gradient-to-r from-green-800 to-green-700 shadow-green-200'
            }`}
        >
          {saved ? (
            <><Check className="w-5 h-5" /> Saved Successfully!</>
          ) : (
            <><Save className="w-5 h-5" /> Save Changes</>
          )}
        </motion.button>
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