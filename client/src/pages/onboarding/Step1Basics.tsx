interface Step1Data {
  age?: number
  gender?: string
  height?: number
  weight?: number
}

interface Step1BasicsProps {
  data: Step1Data
  onUpdate: (data: Step1Data) => void
}

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const Step1Basics = ({ data, onUpdate }: Step1BasicsProps) => {
  const handleChange = (field: keyof Step1Data, value: string | number) => {
    onUpdate({ ...data, [field]: value })
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome! Let's get the basics.</h2>
        <p className="text-gray-500">Tell us a bit about yourself to get started.</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
            <input
              type="number"
              min="1"
              max="120"
              value={data.age || ''}
              onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all"
              placeholder="25"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <div className="flex gap-2">
              {genderOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('gender', option.value)}
                  className={`flex-1 py-3 px-3 rounded-xl font-medium text-sm transition-all ${
                    data.gender === option.value
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
            <input
              type="number"
              min="50"
              max="300"
              value={data.height || ''}
              onChange={(e) => handleChange('height', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all"
              placeholder="175"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
            <input
              type="number"
              min="20"
              max="500"
              value={data.weight || ''}
              onChange={(e) => handleChange('weight', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all"
              placeholder="70"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Step1Basics