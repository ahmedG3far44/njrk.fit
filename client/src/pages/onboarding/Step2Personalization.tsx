interface Step2Data {
  religion?: string
  dietPreference?: string
}

interface Step2PersonalizationProps {
  data: Step2Data
  onUpdate: (data: Step2Data) => void
}

const religionOptions = [
  { value: 'muslim', label: 'Muslim' },
  { value: 'christian', label: 'Christian' },
  { value: 'jewish', label: 'Jewish' },
  { value: 'hindu', label: 'Hindu' },
  { value: 'buddhist', label: 'Buddhist' },
  { value: 'none', label: 'No Preference' },
]

const dietOptions = [
  { value: 'keto', label: 'Keto', description: 'Low carb, high fat' },
  { value: 'low_carb', label: 'Low Carb', description: 'Reduced carbohydrates' },
  { value: 'high_protein', label: 'High Protein', description: 'Build lean muscle' },
  { value: 'balanced', label: 'Balanced', description: 'Equal macros' },
  { value: 'vegan', label: 'Vegan', description: 'Plant-based only' },
]

const Step2Personalization = ({ data, onUpdate }: Step2PersonalizationProps) => {
  const handleReligionChange = (value: string) => {
    onUpdate({ ...data, religion: value })
  }

  const handleDietChange = (value: string) => {
    onUpdate({ ...data, dietPreference: value })
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Personalize your experience.</h2>
        <p className="text-gray-500">Help us tailor your journey to your lifestyle.</p>
      </div>

      <div className="space-y-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Religion / Fasting Periods
          </label>
          <div className="grid grid-cols-3 gap-3">
            {religionOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleReligionChange(option.value)}
                className={`py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                  data.religion === option.value
                    ? 'bg-purple-50 border-2 border-purple-600 text-purple-700'
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-purple-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Diet Preference
          </label>
          <div className="grid grid-cols-2 gap-3">
            {dietOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleDietChange(option.value)}
                className={`p-4 rounded-xl text-left transition-all ${
                  data.dietPreference === option.value
                    ? 'bg-purple-50 border-2 border-purple-600'
                    : 'bg-white border-2 border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className={`font-semibold ${
                  data.dietPreference === option.value ? 'text-purple-700' : 'text-gray-900'
                }`}>
                  {option.label}
                </div>
                <div className={`text-sm mt-1 ${
                  data.dietPreference === option.value ? 'text-purple-500' : 'text-gray-500'
                }`}>
                  {option.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Step2Personalization