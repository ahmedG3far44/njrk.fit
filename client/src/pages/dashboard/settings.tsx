import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userService, type UpdateUserData } from '../../services/user'
import { useAuth } from '../../contexts/AuthContext'
import { Loader2, Trash2, Bell, Mail, Utensils, Settings, Camera, Calendar, Save, Bell as BellIcon, ChevronRight, CheckCircle, X, LucideUser } from 'lucide-react'

const GOALS = [
  { value: 'lose_weight', label: 'Weight Loss' },
  { value: 'gain_weight', label: 'Weight Gain' },
  { value: 'maintain_weight', label: 'Maintain Weight' },
  { value: 'build_muscle', label: 'Build Muscle' },
]

const REMINDER_TYPES = ['Meals', 'Workouts', 'Check-ins']

interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  read: boolean
}

const mockNotifications: NotificationItem[] = [
  { id: '1', title: 'Workout Reminder', message: 'Time to start your morning workout!', time: '5 min ago', read: false },
  { id: '2', title: 'Meal Ready', message: 'Your lunch is ready to log', time: '1 hour ago', read: false },
  { id: '3', title: 'Weekly Summary', message: 'Your weekly progress report is ready', time: '1 day ago', read: true },
  { id: '4', title: 'Streak Alert', message: 'Keep your 15-day streak alive!', time: '2 days ago', read: true },
]

const SettingsPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  interface FriendRequest {
    id: string
    name: string
    avatar?: string
    mutualFriends: number
    time: string
  }

  interface RewardNotification {
    id: string
    title: string
    description: string
    points: number
    icon: string
    read: boolean
  }

  const mockFriendRequests: FriendRequest[] = [
    { id: '1', name: 'Sarah Johnson', mutualFriends: 5, time: '2h ago' },
    { id: '2', name: 'Mike Chen', mutualFriends: 3, time: '5h ago' },
    { id: '3', name: 'Emma Wilson', mutualFriends: 8, time: '1d ago' },
  ]

  const mockRewards: RewardNotification[] = [
    { id: '1', title: '7-Day Streak!', description: 'You worked out for 7 days in a row', points: 100, icon: '🔥', read: false },
    { id: '2', title: 'First Check-in', description: 'Completed your first check-in', points: 50, icon: '⭐', read: false },
    { id: '3', title: 'Meal Master', description: 'Logged 10 meals this week', points: 75, icon: '🥗', read: true },
  ]

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(mockFriendRequests)
  const [rewards, setRewards] = useState<RewardNotification[]>(mockRewards)
  const [unreadCount, setUnreadCount] = useState(mockNotifications.filter(n => !n.read).length + mockRewards.filter(r => !r.read).length)

  // const [notificationsExpanded, setNotificationsExpanded] = useState(false)
  const [preferencesExpanded, setPreferencesExpanded] = useState(false)

  const [preferences, setPreferences] = useState({
    notifications: user?.preferences?.notifications ?? true,
    weeklySummary: user?.preferences?.weeklySummary ?? true,
    mealReminders: user?.preferences?.mealReminders ?? true,
    isFasting: false,
    autoGenerateMeals: user?.preferences?.autoGenerateMeals ?? false,
    reminderTime: user?.preferences?.reminderTime ?? '08:00',
    reminderTypes: user?.preferences?.reminderTypes ?? ['Meals'],
  })

  const [profileData, setProfileData] = useState<UpdateUserData>({
    name: user?.name || 'John Doe',
    height: user?.height ?? 175,
    weight: user?.weight ?? 70,
    age: user?.age ?? 30,
    gender: user?.gender ?? 'male',
    goal: user?.goal ?? 'gain_weight',
  })

  const [medicalData, setMedicalData] = useState({
    medicalCondition: user?.medicalCondition || 'Asthma',
    allergies: user?.allergies?.join(', ') || 'Peanuts, Shellfish',
  })

  const [medicalSaved, setMedicalSaved] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const updatePrefsMutation = useMutation({
    mutationFn: (prefs: UpdateUserData['preferences']) =>
      userService.updateProfile({ preferences: prefs }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateUserData) => userService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      setMedicalSaved(true)
    },
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => userService.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: () => {
      alert('Failed to upload avatar')
    },
    onSettled: () => setIsUploading(false)
  })

  const handlePreferenceChange = async (key: keyof typeof preferences, value: any) => {
    const newPrefs = { ...preferences, [key]: value }
    setPreferences(newPrefs)
    await updatePrefsMutation.mutateAsync(newPrefs as UpdateUserData['preferences'])
  }

  const handleProfileSave = async () => {
    setIsSaving(true)
    await updateProfileMutation.mutateAsync(profileData)
    setIsSaving(false)
    alert('Profile saved!')
  }

  const handleMedicalSave = async () => {
    setIsSaving(true)
    await updateProfileMutation.mutateAsync({
      medicalCondition: medicalData.medicalCondition,
      allergies: medicalData.allergies.split(',').map(a => a.trim()).filter(Boolean),
    })
    setIsSaving(false)
    setMedicalSaved(true)
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsUploading(true)
      uploadAvatarMutation.mutate(file)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    navigate('/')
  }

  const handleReminderTypeToggle = (type: string) => {
    const types = preferences.reminderTypes.includes(type)
      ? preferences.reminderTypes.filter(t => t !== type)
      : [...preferences.reminderTypes, type]
    handlePreferenceChange('reminderTypes', types)
  }

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markRewardRead = (id: string) => {
    setRewards(prev => prev.map(r => r.id === id ? { ...r, read: true } : r))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const handleAcceptRequest = (id: string) => {
    setFriendRequests(prev => prev.filter(r => r.id !== id))
  }

  const handleDeclineRequest = (id: string) => {
    setFriendRequests(prev => prev.filter(r => r.id !== id))
  }

  const toggleNotificationsPanel = () => {
    setNotificationsOpen(!notificationsOpen)
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-lg sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto px-2 sm:px-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">Settings & Profile</h1>
          <p className="text-gray-500 text-xs sm:text-sm hidden sm:block">Manage your personal data and preferences.</p>
        </div>
        <div className="relative">
          <button
            onClick={toggleNotificationsPanel}
            className="p-2 rounded-full hover:bg-gray-100 relative"
          >
            <BellIcon className="w-4 sm:w-5 h-4 sm:h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-red-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {notificationsOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={() => setNotificationsOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-full sm:w-80 md:w-96 bg-white shadow-2xl z-50 overflow-hidden animate-slide-in">
            <div className="flex flex-col h-full">
              <div className="p-3 sm:p-4 border-b flex items-center justify-between bg-gray-50">
                <div>
                  <h2 className="font-bold text-base sm:text-lg">Notifications</h2>
                  <p className="text-xs text-gray-500">{unreadCount} unread</p>
                </div>
                <button onClick={() => setNotificationsOpen(false)} className="p-2 hover:bg-gray-200 rounded-full">
                  <X className="w-4 sm:w-5 h-4 sm:h-5" />
                </button>
              </div>

              {friendRequests.length > 0 && (
                <div className="border-b">
                  <div className="p-2 sm:p-3 bg-gray-50">
                    <h3 className="font-semibold text-xs sm:text-sm">Friend Requests</h3>
                  </div>
                  {friendRequests.map(request => (
                    <div key={request.id} className="p-4 border-b">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                          {request.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{request.name}</p>
                          <p className="text-xs text-gray-500">{request.mutualFriends} mutual friends • {request.time}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          className="flex-1 py-1.5 sm:py-2 bg-purple-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-purple-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(request.id)}
                          className="flex-1 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto">
                <div className="p-2 sm:p-3 bg-gray-50">
                  <h3 className="font-semibold text-xs sm:text-sm">Rewards</h3>
                </div>

                {rewards.map(reward => (
                  <div
                    key={reward.id}
                    onClick={() => markRewardRead(reward.id)}
                    className={`p-3 sm:p-4 border-b cursor-pointer hover:bg-gray-50 ${!reward.read ? 'bg-purple-50' : ''}`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-xl sm:text-2xl">{reward.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{reward.title}</p>
                          <span className="text-green-600 font-bold text-xs sm:text-sm">+{reward.points}</span>
                        </div>
                        <p className="text-xs text-gray-500">{reward.description}</p>
                        {!reward.read && <div className="w-2 h-2 bg-purple-500 rounded-full mt-1 sm:mt-2" />}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="p-2 sm:p-3 bg-gray-50">
                  <h3 className="font-semibold text-xs sm:text-sm">Notifications</h3>
                </div>
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => markNotificationRead(notif.id)}
                    className={`p-3 sm:p-4 border-b cursor-pointer hover:bg-gray-50 ${!notif.read ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {!notif.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 sm:mt-2" />}
                      <div className="flex-1">
                        <p className="font-medium text-xs sm:text-sm">{notif.title}</p>
                        <p className="text-xs text-gray-500">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-0.5 sm:mt-1">{notif.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-4">
        <h2 className="font-semibold text-sm sm:text-base">Personal Profile</h2>

        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-4xl font-medium overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || 'J'
              )}
            </div>
            <button
              onClick={handleAvatarClick}
              disabled={isUploading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">{user?.name || 'John Doe'}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                {user?.subscriptionTier || 'PRO'}
              </span>
              {(user?.subscriptionTier === 'PRO' || user?.subscriptionTier === 'FAMILY') && (
                <span className="px-2 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full text-xs font-medium">
                  Njerka.{user?.subscriptionTier}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Date of Birth</label>
            <input
              type="date"
              value={profileData.age ? new Date().getFullYear() - profileData.age + '-01-01' : '1994-01-01'}
              onChange={(e) => {
                const dob = new Date(e.target.value)
                const age = new Date().getFullYear() - dob.getFullYear()
                setProfileData({ ...profileData, age })
              }}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Gender</label>
            <select
              value={profileData.gender || ''}
              onChange={(e) => setProfileData({ ...profileData, gender: e.target.value as any })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Height (cm)</label>
            <input
              type="number"
              value={profileData.height || ''}
              onChange={(e) => setProfileData({ ...profileData, height: parseInt(e.target.value) || undefined })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Weight (kg)</label>
            <input
              type="number"
              value={profileData.weight || ''}
              onChange={(e) => setProfileData({ ...profileData, weight: parseInt(e.target.value) || undefined })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700">Your Goal</label>
          <select
            value={profileData.goal || ''}
            onChange={(e) => setProfileData({ ...profileData, goal: e.target.value as any })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {GOALS.map((goal) => (
              <option key={goal.value} value={goal.value}>{goal.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleProfileSave}
          disabled={isSaving}
          className="w-full py-2 sm:py-2.5 bg-purple-600 text-white text-sm sm:text-base rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-3 sm:p-6 space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm sm:text-base">Medical Profile</h2>
            <p className="text-xs sm:text-sm text-gray-500">This information is private and only used to customize your meal and workout plans.</p>
          </div>
          {medicalSaved && (
            <span className="flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" /> Saved
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700">Active Medical Conditions</label>
          <input
            type="text"
            value={medicalData.medicalCondition}
            onChange={(e) => {
              setMedicalData({ ...medicalData, medicalCondition: e.target.value })
              setMedicalSaved(false)
            }}
            placeholder="e.g., Diabetes, Hypertension"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700">Allergies</label>
          <input
            type="text"
            value={medicalData.allergies}
            onChange={(e) => {
              setMedicalData({ ...medicalData, allergies: e.target.value })
              setMedicalSaved(false)
            }}
            placeholder="e.g., Peanuts, Shellfish, Gluten"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <p className="text-xs text-gray-400 mt-1">Separate multiple allergies with commas</p>
        </div>

        <button
          onClick={handleMedicalSave}
          disabled={isSaving || medicalSaved}
          className="w-full py-2 sm:py-2.5 bg-emerald-600 text-white text-sm sm:text-base rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
          {isSaving ? 'Updating...' : 'Update Medical Profile'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-4">
        <h2 className="font-semibold text-lg">Notifications</h2>

        <ToggleOption
          icon={<Bell className="w-5 h-5" />}
          title="Push Notifications"
          description="Receive workout and meal reminders"
          enabled={preferences.notifications}
          onChange={(v) => handlePreferenceChange('notifications', v)}
        />

        <ToggleOption
          icon={<Mail className="w-5 h-5" />}
          title="Weekly Summary"
          description="Receive weekly progress email"
          enabled={preferences.weeklySummary}
          onChange={(v) => handlePreferenceChange('weeklySummary', v)}
        />

        <ToggleOption
          icon={<Utensils className="w-5 h-5" />}
          title="Meal Reminders"
          description="Get reminded for meals"
          enabled={preferences.mealReminders}
          onChange={(v) => handlePreferenceChange('mealReminders', v)}
        />
        {
          user.religion === "muslim" && (
            <ToggleOption
              icon={<LucideUser className="w-5 h-5" />}
              title="Fasting Mode"
              description="Activate fasting mode"
              enabled={preferences.isFasting}
              onChange={(v) => handlePreferenceChange('isFasting', v)}
            />
          )
        }

        <div className="border-t pt-4">
          <button
            onClick={() => setPreferencesExpanded(!preferencesExpanded)}
            className="w-full flex items-center justify-between py-2"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Advanced Notifications</span>
            </div>
            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${preferencesExpanded ? 'rotate-90' : ''}`} />
          </button>

          <div className={`overflow-hidden transition-all duration-300 ${preferencesExpanded ? 'max-h-96 mt-4' : 'max-h-0'}`}>
            <div className="space-y-4 pl-7">
              <ToggleOption
                icon={<Calendar className="w-5 h-5" />}
                title="Auto-Generate Meals"
                description="Automatically create personalized meals"
                enabled={preferences.autoGenerateMeals}
                onChange={(v) => handlePreferenceChange('autoGenerateMeals', v)}
              />

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Reminder Time</label>
                <input
                  type="time"
                  value={preferences.reminderTime}
                  onChange={(e) => handlePreferenceChange('reminderTime', e.target.value)}
                  className="mt-1 block px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Reminder Types</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {REMINDER_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleReminderTypeToggle(type)}
                      className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${preferences.reminderTypes.includes(type)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-4">
        <h2 className="font-semibold text-lg">Subscription</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{user?.subscriptionTier || 'PRO'} Plan</p>
            <p className="text-sm text-gray-500">Current plan</p>
          </div>
          <button
            onClick={() => navigate('/dashboard/subscription')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Manage Subscription
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-4">
        <h2 className="font-semibold text-lg">Account</h2>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center gap-3 p-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
        >
          <Trash2 className="w-5 h-5" />
          <span>Delete Account</span>
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Delete Account?</h3>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. All your data will be permanently deleted.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const ToggleOption = ({
  icon,
  title,
  description,
  enabled,
  onChange
}: {
  icon: React.ReactNode
  title: string
  description: string
  enabled: boolean
  onChange: (value: boolean) => void
}) => (
  <div className="flex items-center justify-between py-2 sm:py-3">
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="text-gray-600 flex-shrink-0">{icon}</div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-gray-500 hidden sm:block">{description}</p>
      </div>
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`w-9 h-5 sm:w-11 sm:h-6 rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-purple-600' : 'bg-gray-300'
        }`}
    >
      <div
        className={`w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full transition-transform ${enabled ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0.5'
          }`}
      />
    </button>
  </div>
)

export default SettingsPage