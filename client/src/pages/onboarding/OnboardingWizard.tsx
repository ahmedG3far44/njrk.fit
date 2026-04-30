import { useState } from 'react'
import { useNavigate } from 'react-router-dom'


import Step1Basics from './Step1Basics'
import Step2Personalization from './Step2Personalization'
import Step3MedicalFitness, { type activityOptionsType } from './Step3MedicalFitness'
import Step4MedicalVault from './Step4MedicalVault'
import Step5Dream from './Step5Dream'
import { LucideHeart, LucideSettings, LucideShieldAlert, LucideSparkle, LucideUser } from 'lucide-react'


const TOTAL_STEPS = 5

const BASE_URL = import.meta.env.VITE_API_URL as string

interface StepConfig {
  id: number
  label: string
  icon: React.ReactNode
}

const stepConfigs: StepConfig[] = [
  { id: 1, label: 'Basics', icon: <UserIcon /> },
  { id: 2, label: 'Personalize', icon: <SettingsIcon /> },
  { id: 3, label: 'Health', icon: <HeartIcon /> },
  { id: 4, label: 'Medical', icon: <ShieldIcon /> },
  { id: 5, label: 'Dream', icon: <SparkleIcon /> },
]

function UserIcon() {
  return (
    <LucideUser size={20} className="text-primary" />
  )
}

function SettingsIcon() {
  return (
    <LucideSettings size={20} className="text-primary" />
  )
}

function HeartIcon() {
  return (
    <LucideHeart size={20} className="text-primary" />
  )
}

function ShieldIcon() {
  return (
    <LucideShieldAlert size={20} className="text-primary" />
  )
}

function SparkleIcon() {
  return (
    <LucideSparkle size={20} className="text-primary" />
  )
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.06-1.06l-4.5 4.5a.75.75 0 001.06 1.06l4.5-4.5a.75.75 0 000-1.06z" clipRule="evenodd" />
    </svg>
  )
}

type goals = "lose_weight" | "gain_weight" | "maintain_weight";

interface OnboardingData {
  step1: {
    age?: number
    gender?: string
    height?: number
    weight?: number
  }
  step2: {
    religion?: string
    foodPreferences?: string[]
  }
  step3: {
    allergies?: string[]
    otherAllergy?: string
    activityLevel?: activityOptionsType
  }
  step4: {
    medicalFiles?: string[]
  }
  step5: {
    dreamGoal?: string
    targetWeight?: number
    userGoal?: goals
  }
}


const initialData: OnboardingData = {
  step1: { age: 23, gender: 'male', height: 175, weight: 70 },
  step2: { religion: 'muslim', foodPreferences: [] },
  step3: { allergies: [], otherAllergy: '', activityLevel: { title: '', slug: '', emoji: '', description: '', value: 0 } },
  step4: { medicalFiles: [] },
  step5: { dreamGoal: '', targetWeight: 0, userGoal: 'lose_weight' },
}


const OnboardingWizard = () => {
  const navigate = useNavigate()
  // const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [errors, setErrors] = useState<Record<number, Partial<Record<string, string>>>>({
    1: {
      age: '',
      gender: '',
      height: '',
      weight: '',
    }, 2: {
      religion: '',
      foodPreferences: '',
    }, 3: {
      allergies: '',
      otherAllergy: '',
      activityLevel: '',
    }, 4: {
      medicalFiles: '',
    }, 5: {
      dreamGoal: '',
      targetWeight: '',
      userGoal: ''
    }
  })


  const validateStep = (step: number) => {
    let currentErrors: Partial<Record<string, string>> = {}

    if (step === 1) {
      const data1 = onboardingData.step1
      if (!data1.age) currentErrors.age = 'Age is required'
      else if (data1.age < 1 || data1.age > 120) currentErrors.age = 'Age must be between 1 and 120'

      if (!data1.gender) currentErrors.gender = 'Gender is required'

      if (!data1.height) currentErrors.height = 'Height is required'
      else if (data1.height < 50 || data1.height > 250) currentErrors.height = 'Height must be between 50 and 250 cm'

      if (!data1.weight) currentErrors.weight = 'Weight is required'
      else if (data1.weight < 40 || data1.weight > 200) currentErrors.weight = 'Weight must be between 40 and 200 kg'
    }

    if (step === 2) {
      const data2 = onboardingData.step2
      if (!data2.religion) currentErrors.religion = 'Religion is required'
      if (!data2.foodPreferences || data2.foodPreferences.length === 0)
        currentErrors.foodPreferences = 'Food preferences are required'
    }

    if (step === 3) {
      const data3 = onboardingData.step3

      if (data3.allergies.length === 0) currentErrors.allergies = 'Please select at least one dietary restriction or none if you don\'t have any'
      if (data3.activityLevel?.slug === "" || data3.activityLevel?.title === "") currentErrors.activityLevel = 'Please select an activity level'
    }

    if (step === 5) {
      const data5 = onboardingData.step5

      if (!data5.targetWeight) currentErrors.targetWeight = 'Target weight is required please enter it'

      switch (data5.userGoal) {
        case "lose_weight":
          if (data5.targetWeight >= onboardingData.step1.weight) currentErrors.targetWeight = 'Target weight must be less than current weight'
          break
        case "gain_weight":
          if (data5.targetWeight <= onboardingData.step1.weight) currentErrors.targetWeight = 'Target weight must be greater than current weight'
          break
        case "maintain_weight":
          if (data5.targetWeight !== onboardingData.step1.weight) currentErrors.targetWeight = 'Target weight must be equal to current weight'
          break
      }
    }

    setErrors(prev => ({ ...prev, [step]: currentErrors }))
    return Object.keys(currentErrors).length === 0
  }

  const updateStepData = (step: keyof OnboardingData, data: Partial<OnboardingData[keyof OnboardingData]>) => {
    setOnboardingData(prev => ({
      ...prev,
      [step]: { ...prev[step], ...data }
    }))
  }

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      if (validateStep(currentStep)) setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleBuildMyPlan = async () => {

    const isValid = await validateStep(currentStep)
    if (!isValid) return

    setIsSubmitting(true)
    setSubmitError('')
    try {

      const updates = {
        age: onboardingData.step1.age,
        gender: onboardingData.step1.gender as 'male' | 'female',
        height: onboardingData.step1.height,
        weight: onboardingData.step1.weight,
        activityLevel: onboardingData.step3.activityLevel?.slug,
        allergies: onboardingData.step3.allergies,
        dietaryRestrictions: onboardingData.step2.foodPreferences,
        medicalDocuments: onboardingData.step4.medicalFiles,
        fitnessGoal: onboardingData.step5.dreamGoal,
        religion: onboardingData.step2.religion,
        targetWeight: onboardingData.step5.targetWeight,
        userGoal: onboardingData.step5.userGoal,
      }


      console.log(updates)

      const response = await fetch(`${BASE_URL}/auth/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to complete onboarding')
      }

      const data = await response.json()

      console.log(data)

      // Update auth context or trigger refetch
      navigate('/dashboard/insights')
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      setSubmitError(error instanceof Error ? error.message : 'Failed to complete onboarding')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Basics
            data={onboardingData.step1}
            onUpdate={(data) => updateStepData('step1', data)}
            errors={errors[1]}
          />
        )
      case 2:
        return (
          <Step2Personalization
            data={onboardingData.step2}
            onUpdate={(data) => updateStepData('step2', data)}
            errors={errors[2]}
          />
        )
      case 3:
        return (
          <Step3MedicalFitness
            data={onboardingData.step3}
            onUpdate={(data) => updateStepData('step3', data)}
            errors={errors[3]}
          />
        )
      case 4:
        return (
          <Step4MedicalVault
            data={onboardingData.step4}
            onUpdate={(data) => updateStepData('step4', data)}
            onNext={handleNext}
            errors={errors[4]}
          />
        )
      case 5:
        return (
          <Step5Dream
            data={onboardingData.step5}
            onUpdate={(data) => updateStepData('step5', data)}
            errors={errors[5]}
          />
        )
      default:
        return null
    }
  }

  const getStepStatus = (stepNum: number) => {
    if (stepNum < currentStep) return 'completed'
    if (stepNum === currentStep) return 'active'
    return 'pending'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {stepConfigs.map((step, index) => {
              const status = getStepStatus(step.id)
              const isLast = index === stepConfigs.length - 1
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${status === 'completed'
                        ? 'bg-green-500 text-white'
                        : status === 'active'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-400'
                        }`}
                    >
                      {status === 'completed' ? (
                        <CheckIcon />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <span
                      className={`text-xs mt-1.5 font-medium ${status === 'completed'
                        ? 'text-gray-500'
                        : status === 'active'
                          ? 'text-purple-600'
                          : 'text-gray-400'
                        }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${index < currentStep - 1 ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      style={{ minWidth: '40px', maxWidth: '80px' }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-8">
              {renderStep()}
            </div>

            {submitError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {submitError}
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={handleBack}
                className={`text-gray-600 hover:text-gray-800 font-medium px-4 py-2 rounded-lg transition-colors ${currentStep === 1 ? 'opacity-0 pointer-events-none' : ''
                  }`}
              >
                Back
              </button>

              {currentStep === TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={handleBuildMyPlan}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Building...
                    </>
                  ) : (
                    <>
                      <SparkleIcon />
                      Build My Plan
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    const isValid = await validateStep(currentStep)
                    console.log(isValid)
                    isValid && handleNext()
                  }}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Next
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingWizard