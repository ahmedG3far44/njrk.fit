import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userService, type UpdateUserData } from '../../services/user'

const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very active']
const FITNESS_GOALS = ['Build muscle', 'Lose fat', 'Improve endurance', 'Better flexibility', 'Maintain weight', 'General health']
const DIETARY_RESTRICTIONS = ['Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Keto', 'Paleo', 'Low-carb', 'Nut-free']
const EQUIPMENT = ['None', 'Dumbbells', 'Barbell', 'Pull-up bar', 'Resistance bands', 'Kettlebell', 'Cardio machines', 'Full gym']

const ProfileEditPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<UpdateUserData>({
    name: '',
    height: undefined,
    weight: undefined,
    age: undefined,
    activityLevel: 'moderate',
    fitnessGoals: [],
    dietaryRestrictions: [],
    equipment: [],
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const updateMutation = useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
      navigate('/dashboard/profile')
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Update failed')
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    await updateMutation.mutateAsync(formData)
    setIsLoading(false)
  }

  const toggleArrayField = (field: 'fitnessGoals' | 'dietaryRestrictions' | 'equipment', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field]?.includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...(prev[field] || []), value],
    }))
  }

  const handleNumberChange = (field: 'height' | 'weight' | 'age', value: string) => {
    const num = value ? parseInt(value) : undefined
    setFormData((prev) => ({ ...prev, [field]: num }))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="font-semibold">Basic Info</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
              <input
                type="number"
                value={formData.height || ''}
                onChange={(e) => handleNumberChange('height', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
              <input
                type="number"
                value={formData.weight || ''}
                onChange={(e) => handleNumberChange('weight', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Age</label>
              <input
                type="number"
                value={formData.age || ''}
                onChange={(e) => handleNumberChange('age', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Activity Level</label>
            <select
              value={formData.activityLevel}
              onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {ACTIVITY_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="font-semibold">Fitness Goals</h2>
          <div className="flex flex-wrap gap-2">
            {FITNESS_GOALS.map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => toggleArrayField('fitnessGoals', goal)}
                className={`px-3 py-1 rounded-full text-sm ${
                  formData.fitnessGoals?.includes(goal)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="font-semibold">Dietary Restrictions</h2>
          <div className="flex flex-wrap gap-2">
            {DIETARY_RESTRICTIONS.map((restriction) => (
              <button
                key={restriction}
                type="button"
                onClick={() => toggleArrayField('dietaryRestrictions', restriction)}
                className={`px-3 py-1 rounded-full text-sm ${
                  formData.dietaryRestrictions?.includes(restriction)
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {restriction}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="font-semibold">Equipment</h2>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleArrayField('equipment', item)}
                className={`px-3 py-1 rounded-full text-sm ${
                  formData.equipment?.includes(item)
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/profile')}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProfileEditPage