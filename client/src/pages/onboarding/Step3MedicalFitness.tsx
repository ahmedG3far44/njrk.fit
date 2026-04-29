import ErrorMessage from "../../components/ErrorMessage"

export interface activityOptionsType {
  title: string
  slug: string;
  emoji: string
  description: string
  value: number
}

interface Step3Data {
  allergies?: string[]
  otherAllergy?: string
  activityLevel?: activityOptionsType
}

interface Step3MedicalFitnessProps {
  data: Step3Data
  onUpdate: (data: Step3Data) => void
  errors: Partial<Record<string, string>>
}

const allergyOptions = [
  'Insulin Resistance',
  'Peanuts',
  'Shellfish',
  'Dairy',
  'Eggs',
  'Soy',
  'Wheat',
  'Tree Nuts',
  'Fish',
  'Sesame',
  'Gluten',
  'Lactose',
  'Diabetes',
  'PCOS',
  'None',
]

const activityOptions = [
  {
    title: 'Sedentary',
    slug: 'sedentary',
    emoji: '🪑',
    description: 'Little to no exercise, desk job',
    value: 1.2
  },
  {
    title: 'Lightly Active',
    emoji: '🚶',
    slug: 'light',
    description: 'Light exercise 1-3 days/week',
    value: 1.375
  },
  {
    title: 'Moderately Active',
    emoji: '🚴',
    slug: 'moderate',
    description: 'Moderate exercise 3-5 days/week',
    value: 1.5
  },
  {
    title: 'Very Active',
    emoji: '🏃',
    slug: 'active',
    description: 'Hard exercise 6-7 days/week',
    value: 1.7
  },
  {
    title: 'Extremely Active',
    emoji: '💪',
    slug: 'very_active',
    description: 'Physical job + hard daily training',
    value: 1.9
  },
]

const Step3MedicalFitness = ({ data, onUpdate, errors }: Step3MedicalFitnessProps) => {
  const allergies = data.allergies || []

  const toggleAllergy = (allergy: string) => {
    if (allergy === 'None') {
      if (allergies.includes('None')) {
        onUpdate({ ...data, allergies: [] })
      } else {
        onUpdate({ ...data, allergies: ['None'] })
      }
      return
    }

    let newAllergies = allergies.filter(a => a !== 'None')
    if (newAllergies.includes(allergy)) {
      newAllergies = newAllergies.filter(a => a !== allergy)
    } else {
      newAllergies = [...newAllergies, allergy]
    }
    onUpdate({ ...data, allergies: newAllergies })
  }

  const handleActivityChange = (activity: activityOptionsType) => {
    onUpdate({ ...data, activityLevel: activity })
  }

  const handleOtherAllergyChange = (value: string) => {
    onUpdate({ ...data, otherAllergy: value })
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Medical info & fitness level</h2>
        <p className="text-gray-500">Help us keep you safe and design the right plan.</p>
      </div>

      <div className="space-y-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Allergies & Intolerances
          </label>
          <div className="grid grid-cols-3 gap-3">
            {allergyOptions.map((allergy) => {
              const isSelected = allergies.includes(allergy)
              return (
                <button
                  key={allergy}
                  type="button"
                  onClick={() => toggleAllergy(allergy)}
                  className={`py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${isSelected
                    ? 'bg-red-50 border-2 border-red-500 text-red-700'
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-red-300'
                    }`}
                >
                  {isSelected && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-500">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  )}
                  {allergy}
                </button>
              )
            })}
          </div>

          <div className="mt-4">
            <input
              type="text"
              value={data.otherAllergy || ''}
              onChange={(e) => handleOtherAllergyChange(e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all border-gray-300`}
              placeholder="Other allergy? Type here..."
            />
          </div>
        </div>

        {errors.allergies && <ErrorMessage message={errors.allergies} />}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Activity Level
          </label>
          <div className="space-y-3">
            {activityOptions.map((option) => {
              const isSelected = data.activityLevel?.slug === option.slug
              return (
                <button
                  key={option.slug}
                  type="button"
                  onClick={() => handleActivityChange(option)}
                  className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${isSelected
                    ? 'bg-purple-50 border-2 border-purple-600'
                    : 'bg-white border-2 border-gray-200 hover:border-purple-300'
                    }`}
                >
                  <span className="text-3xl">{option.emoji}</span>
                  <div className="flex-1 text-left">
                    <div className={`font-semibold ${isSelected ? 'text-purple-700' : 'text-gray-900'}`}>
                      {option.title}
                    </div>
                    <div className={`text-sm ${isSelected ? 'text-purple-500' : 'text-gray-500'}`}>
                      {option.description}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
        {errors.activityLevel && <ErrorMessage message={errors.activityLevel} />}
      </div>
    </div>
  )
}

export default Step3MedicalFitness