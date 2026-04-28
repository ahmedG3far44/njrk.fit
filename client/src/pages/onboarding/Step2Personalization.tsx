import ErrorMessage from "../../components/ErrorMessage"

interface Step2Data {
  religion?: string
  foodPreferences?: string[]
}

interface Step2PersonalizationProps {
  data: Step2Data
  onUpdate: (data: Step2Data) => void
  errors: Partial<Record<string, string>>
}

const religionOptions = [
  { value: 'muslim', label: 'Muslim' },
  { value: 'christian', label: 'Christian' },
]
export const foodTypeOptions = [
  {
    id: "1",
    value: 'chicken',
    label: 'Chicken',
    icon: '🍗',
    category: 'protein',
    description: 'Lean poultry protein'
  },
  {
    id: "2",
    value: 'red_meat',
    label: 'Red Meat',
    icon: '🥩',
    category: 'protein',
    description: 'Beef, lamb'
  },
  {
    id: "3",
    value: 'fish',
    label: 'Fish',
    icon: '🐟',
    category: 'protein',
    description: 'Rich in omega-3'
  },
  {
    id: "4",
    value: 'eggs',
    label: 'Eggs',
    icon: '🥚',
    category: 'protein',
    description: 'High-quality protein'
  },
  {
    id: "5",
    value: 'dairy',
    label: 'Dairy',
    icon: '🧀',
    category: 'fat_protein',
    description: 'Milk, cheese, yogurt'
  },
  {
    id: "6",
    value: 'legumes',
    label: 'Legumes',
    icon: '🫘',
    category: 'plant_protein',
    description: 'Beans, lentils, chickpeas'
  },
  {
    id: "7",
    value: 'grains',
    label: 'Grains',
    icon: '🍞',
    category: 'carbs',
    description: 'Rice, bread, oats'
  },
  {
    id: "8",
    value: 'fruits',
    label: 'Fruits',
    icon: '🍎',
    category: 'carbs',
    description: 'Natural sugars & fiber'
  },
  {
    id: "9",
    value: 'vegetables',
    label: 'Vegetables',
    icon: '🥦',
    category: 'fiber',
    description: 'Essential micronutrients'
  },
  {
    id: "10",
    value: 'nuts',
    label: 'Nuts & Seeds',
    icon: '🥜',
    category: 'fats',
    description: 'Healthy fats & protein'
  },
  {
    id: "11",
    value: 'healthy_fats',
    label: 'Healthy Fats',
    icon: '🥑',
    category: 'fats',
    description: 'Olive oil, avocado, butter'
  },
  {
    id: "12",
    value: 'processed_foods',
    label: 'Processed Foods',
    icon: '🍟',
    category: 'unhealthy',
    description: 'Fast food, packaged snacks'
  },
  {
    id: "13",
    value: 'sugary_foods',
    label: 'Sugary Foods',
    icon: '🍩',
    category: 'carbs',
    description: 'Desserts, sweets, added sugar'
  },
  {
    id: "14",
    value: 'beverages',
    label: 'Beverages',
    icon: '🥤',
    category: 'drinks',
    description: 'Juices, soda, soft drinks'
  },
  {
    id: "15",
    value: 'seafood',
    label: 'Seafood',
    icon: '🦐',
    category: 'protein',
    description: 'Shrimp, crab, shellfish'
  },
  {
    id: "16",
    value: 'protein_supplements',
    label: 'Protein Supplements',
    icon: '🥤',
    category: 'protein',
    description: 'Protein powders, shakes'
  }
];

const Step2Personalization = ({ data, onUpdate, errors }: Step2PersonalizationProps) => {
  const handleReligionChange = (value: string) => {
    onUpdate({ ...data, religion: value })
  }

  const handleFoodPreferenceChange = (value: string) => {
    const currentPrefs = data.foodPreferences || []
    const isSelected = currentPrefs.includes(value)
    const newPrefs = isSelected
      ? currentPrefs.filter(p => p !== value)
      : [...currentPrefs, value]
    onUpdate({ ...data, foodPreferences: newPrefs })
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
          <div className="grid grid-cols-2 gap-3">
            {religionOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleReligionChange(option.value)}
                className={`py-3 px-4 rounded-xl font-medium text-sm transition-all ${data.religion === option.value
                  ? 'bg-purple-50 border-2 border-purple-600 text-purple-700'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-purple-300'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {errors.religion && <ErrorMessage message={errors.religion} />}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Food Type Preferences
          </label>
          <div className="grid grid-cols-4 gap-3">
            {foodTypeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleFoodPreferenceChange(option.value)}
                className={`py-3 px-4 rounded-xl text-left flex flex-col items-center cursor-pointer gap-1 justify-center transition-all ${(data.foodPreferences || []).includes(option.value)
                  ? 'bg-purple-50 border-2 border-purple-600'
                  : 'bg-white border-2 border-gray-200 hover:border-purple-300'
                  }`}
              >
                <div className="text-lg">{option.icon}</div>
                <div className={`font-medium text-sm ${(data.foodPreferences || []).includes(option.value) ? 'text-purple-700' : 'text-gray-900'
                  }`}>
                  {option.label}
                </div>
                <div className={`text-xs mt-1 text-center ${(data.foodPreferences || []).includes(option.value) ? 'text-purple-500' : 'text-gray-500'
                  }`}>
                  {option.description}
                </div>
              </button>
            ))}
          </div>
          {errors.foodPreferences && <ErrorMessage message={errors.foodPreferences} />}
        </div>
      </div>
    </div>
  )
}

export default Step2Personalization