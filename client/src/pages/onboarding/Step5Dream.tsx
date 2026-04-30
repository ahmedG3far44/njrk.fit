import { useState, useEffect } from 'react'
import ErrorMessage from '../../components/ErrorMessage'

interface Step5Data {
  dreamGoal?: string
  targetWeight?: number
  userGoal?: "lose_weight" | "gain_weight" | "maintain_weight"
}

interface Step5DreamProps {
  data: Step5Data
  onUpdate: (data: Step5Data) => void
  errors: Partial<Record<string, string>>
}

const suggestionPills = [
  '+ Lose weight without starving',
  '+ Build lean muscle at home',
  '+ Have more energy throughout the day',
  '+ Fit into my favorite clothes again',
  '+ Improve my overall health markers',
  '+ Get stronger for everyday activities',
  '+ Maintain weight long-term',
  '+ Feel confident in my own skin',
]

const Step5Dream = ({ data, onUpdate, errors }: Step5DreamProps) => {
  const [charCount, setCharCount] = useState(data.dreamGoal?.length || 0)

  useEffect(() => {
    setCharCount(data.dreamGoal?.length || 0)
  }, [data.dreamGoal])

  const handleTextChange = (value: string) => {
    onUpdate({ dreamGoal: value })
  }
  const handleTargetWeightChange = (value: number) => {
    onUpdate({ ...data, targetWeight: value })
  }
  const handleUserGoalChange = (value: "lose_weight" | "gain_weight" | "maintain_weight") => {
    onUpdate({ ...data, userGoal: value })
  }

  const handleAppendSuggestion = (suggestion: string) => {
    const cleanSuggestion = suggestion.replace(/^\+/, '').trim()
    const currentText = data.dreamGoal || ''
    const newText = currentText ? `${currentText} ${cleanSuggestion}` : cleanSuggestion
    onUpdate({ dreamGoal: newText })
  }

  const isGoodDetail = charCount > 20

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What's your dream?</h2>
        <p className="text-gray-500">Describe your ideal body and health goals.</p>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-purple-500">
          <path d="M10.5 1.5a1.5 1.5 0 012.39 2.025l6.375 14.625a1.5 1.5 0 01-2.265 1.823l-4.823-5.39-5.39 4.823a1.5 1.5 0 01-1.823-2.265l14.625-6.375a1.5 1.5 0 011.025-2.39V1.5a1.5 1.5 0 011.5-1.5h2.25a1.5 1.5 0 011.5 1.5v2.25a1.5 1.5 0 002.39 1.025l6.375 14.625a1.5 1.5 0 01-2.265 1.823l-14.625-6.375a1.5 1.5 0 01-1.025-2.39V12a1.5 1.5 0 00-1.5-1.5H11.5a1.5 1.5 0 00-1.5 1.5v2.25a1.5 1.5 0 01-2.39 1.025l-6.375-14.625a1.5 1.5 0 012.265-1.823l14.625 6.375a1.5 1.5 0 011.025 2.39v2.25a1.5 1.5 0 001.5 1.5h2.25a1.5 1.5 0 001.5-1.5V11.5a1.5 1.5 0 00-1.5-1.5h-2.25a1.5 1.5 0 01-1.5-1.5v-.25z" />
        </svg>
        <span className="text-purple-700 font-medium">Paint Your Dream</span>
      </div>

      <div className='space-y-2'>
        <div className='grid grid-cols-2 gap-2'>
          <div className='w-full'>
            <label className="block text-sm font-medium text-gray-700">Target weight:</label>
            <input type="number" value={data.targetWeight || ''} onChange={(e) => handleTargetWeightChange(Number(e.target.value))} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all resize-none ${errors.targetWeight ? 'border-red-500' : 'border-gray-300'}`} placeholder="Target weight" />
            {
              errors.targetWeight && <ErrorMessage message={errors.targetWeight} />
            }
          </div>
          <div className='w-full'>
            <label className="block text-sm font-medium text-gray-700">Your goal:</label>
            <select value={data.userGoal || ''} onChange={(e) => handleUserGoalChange(e.target.value as "lose_weight" | "gain_weight" | "maintain_weight")} className={`w-full px-4 py-3 appearance-none bg-white border rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all resize-none ${errors.userGoal ? 'border-red-500' : 'border-gray-300'}`} >
              <option value="lose_weight">Lose weight</option>
              <option value="gain_weight">Gain weight</option>
              <option value="maintain_weight">Maintain weight</option>
            </select>
            {
              errors.userGoal && <ErrorMessage message={errors.userGoal} />
            }
          </div>

        </div>

        <label className="block text-sm font-medium text-gray-700">Dream goal:</label>
        <textarea
          value={data.dreamGoal || ''}
          onChange={(e) => handleTextChange(e.target.value)}
          rows={5}
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all resize-none ${errors.dreamGoal ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="Describe your dream body and health goals in detail. The more specific you are, the better we can tailor your plan..."
          autoComplete='off'
        />
        {errors.dreamGoal && <ErrorMessage message={errors.dreamGoal} />}
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-500">Character count: {charCount}</span>
          {isGoodDetail && (
            <span className="text-sm text-green-600 font-medium">Great detail!</span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Quick add suggestions:</label>
        <div className="grid grid-cols-2 gap-2">
          {suggestionPills.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => handleAppendSuggestion(pill)}
              className="py-2 px-3 text-left text-sm bg-white border border-gray-200 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all"
            >
              {pill}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Step5Dream