import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { userService } from '../../services/user'
import { useAuth } from '../../contexts/AuthContext'
import { User, Dumbbell, Weight, Cake, Target, Utensils } from 'lucide-react'

const ProfilePage = () => {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: userService.getProfile,
    initialData: user ? { user } : undefined,
  })

  const profile = data?.user

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>
        <Link
          to="/dashboard/settings"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Settings
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600 overflow-hidden">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              profile.name?.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{profile.name}</h2>
            <p className="text-gray-600">{profile.email}</p>
            {profile.subscription && (
              <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                {profile.subscription.status}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Weight className="w-4 h-4" />
            <span className="text-sm">Weight</span>
          </div>
          <p className="text-lg font-semibold">{profile.weight || '-'} kg</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <User className="w-4 h-4" />
            <span className="text-sm">Height</span>
          </div>
          <p className="text-lg font-semibold">{profile.height || '-'} cm</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Cake className="w-4 h-4" />
            <span className="text-sm">Age</span>
          </div>
          <p className="text-lg font-semibold">{profile.age || '-'}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Dumbbell className="w-4 h-4" />
            <span className="text-sm">Activity</span>
          </div>
          <p className="text-lg font-semibold capitalize">{profile.activityLevel || '-'}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Fitness Goals
        </h3>
        <div className="flex flex-wrap gap-2">
          {profile.fitnessGoals?.length ? (
            profile.fitnessGoals.map((goal) => (
              <span key={goal} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {goal}
              </span>
            ))
          ) : (
            <p className="text-gray-500">No goals set</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Utensils className="w-5 h-5" />
          Dietary Restrictions
        </h3>
        <div className="flex flex-wrap gap-2">
          {profile.dietaryRestrictions?.length ? (
            profile.dietaryRestrictions.map((restriction) => (
              <span key={restriction} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                {restriction}
              </span>
            ))
          ) : (
            <p className="text-gray-500">No restrictions</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Dumbbell className="w-5 h-5" />
          Equipment
        </h3>
        <div className="flex flex-wrap gap-2">
          {profile.equipment?.length ? (
            profile.equipment.map((item) => (
              <span key={item} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                {item}
              </span>
            ))
          ) : (
            <p className="text-gray-500">No equipment</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage